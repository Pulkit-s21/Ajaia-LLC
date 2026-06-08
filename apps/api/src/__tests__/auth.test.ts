import request from "supertest";
import app from "../index";
import { prisma } from "../lib/prisma";

const TEST_USER = {
  email: `test_${Date.now()}@example.com`,
  name: "Test User",
  password: "password123",
};

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
  await prisma.$disconnect();
});

describe("Auth endpoints", () => {
  let token: string;

  it("POST /api/auth/register — creates a new user and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(TEST_USER.email);
    token = res.body.token;
  });

  it("POST /api/auth/register — rejects duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);
    expect(res.status).toBe(409);
  });

  it("POST /api/auth/login — returns token for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    token = res.body.token;
  });

  it("POST /api/auth/login — rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me — returns current user with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_USER.email);
  });

  it("GET /api/auth/me — rejects missing token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("Document endpoints", () => {
  let token: string;
  let docId: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    token = loginRes.body.token;
  });

  it("POST /api/documents — creates a document", async () => {
    const res = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Doc", content: "<p>Hello</p>" });
    expect(res.status).toBe(201);
    expect(res.body.document.title).toBe("Test Doc");
    docId = res.body.document.id;
  });

  it("GET /api/documents — lists owned documents", async () => {
    const res = await request(app)
      .get("/api/documents")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.owned.length).toBeGreaterThan(0);
  });

  it("PATCH /api/documents/:id — updates title", async () => {
    const res = await request(app)
      .patch(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Renamed Doc" });
    expect(res.status).toBe(200);
    expect(res.body.document.title).toBe("Renamed Doc");
  });

  it("DELETE /api/documents/:id — deletes document", async () => {
    const res = await request(app)
      .delete(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
