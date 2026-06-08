import request from "supertest";
import app from "../index";
import { prisma } from "../lib/prisma";

const ts = Date.now();
const OWNER = { email: `owner_${ts}@example.com`, name: "Owner", password: "password123" };
const COLLAB = { email: `collab_${ts}@example.com`, name: "Collaborator", password: "password123" };

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [OWNER.email, COLLAB.email] } } });
  await prisma.$disconnect();
});

describe("Document permission enforcement", () => {
  let ownerToken: string;
  let collabToken: string;
  let docId: string;

  beforeAll(async () => {
    const [ownerRes, collabRes] = await Promise.all([
      request(app).post("/api/auth/register").send(OWNER),
      request(app).post("/api/auth/register").send(COLLAB),
    ]);
    ownerToken = ownerRes.body.token;
    collabToken = collabRes.body.token;

    const docRes = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ title: "Private Doc", content: "<p>Secret</p>" });
    docId = docRes.body.document.id;
  });

  it("unshared user cannot access the document", async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${collabToken}`);
    expect(res.status).toBe(403);
  });

  it("owner can share with view-only permission", async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/shares`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ email: COLLAB.email, permission: "view" });
    expect(res.status).toBe(201);
    expect(res.body.share.permission).toBe("view");
  });

  it("view-only user can read the document", async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${collabToken}`);
    expect(res.status).toBe(200);
    expect(res.body.permission).toBe("view");
  });

  it("view-only user cannot edit the document", async () => {
    const res = await request(app)
      .patch(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${collabToken}`)
      .send({ title: "Hijacked" });
    expect(res.status).toBe(403);
  });

  it("view-only user cannot delete the document", async () => {
    const res = await request(app)
      .delete(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${collabToken}`);
    expect(res.status).toBe(403);
  });

  it("owner can upgrade collaborator to edit permission", async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/shares`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ email: COLLAB.email, permission: "edit" });
    expect(res.status).toBe(201);
    expect(res.body.share.permission).toBe("edit");
  });

  it("edit-permission user can update the document", async () => {
    const res = await request(app)
      .patch(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${collabToken}`)
      .send({ title: "Collaborative Title" });
    expect(res.status).toBe(200);
    expect(res.body.document.title).toBe("Collaborative Title");
  });

  it("edit-permission user still cannot delete the document", async () => {
    const res = await request(app)
      .delete(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${collabToken}`);
    expect(res.status).toBe(403);
  });

  it("only the owner can delete the document", async () => {
    const res = await request(app)
      .delete(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
