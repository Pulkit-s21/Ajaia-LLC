import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export async function shareDocument(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const id = req.params.id as string;
  const { email, permission } = req.body;

  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const perm = permission === "edit" ? "edit" : "view";

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  if (doc.ownerId !== userId) {
    res.status(403).json({ error: "Only the owner can share this document" });
    return;
  }

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) {
    res
      .status(404)
      .json({ error: `${email} doesn't have an Ajaia Docs account yet. They need to sign up first.` });
    return;
  }
  if (targetUser.id === userId) {
    res.status(400).json({ error: "Cannot share with yourself" });
    return;
  }

  const share = await prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: id, userId: targetUser.id } },
    update: { permission: perm },
    create: { documentId: id, userId: targetUser.id, permission: perm },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  res.status(201).json({ share });
}

export async function revokeShare(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const id = req.params.id as string;
  const shareId = req.params.shareId as string;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  if (doc.ownerId !== userId) {
    res.status(403).json({ error: "Only the owner can revoke access" });
    return;
  }

  await prisma.documentShare.delete({ where: { id: shareId } });
  res.json({ success: true });
}

export async function listShares(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const id = req.params.id as string;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  if (doc.ownerId !== userId) {
    res.status(403).json({ error: "Only the owner can view shares" });
    return;
  }

  const shares = await prisma.documentShare.findMany({
    where: { documentId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  res.json({ shares });
}
