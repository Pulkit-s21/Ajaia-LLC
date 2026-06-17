import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../lib/prisma"
import fs from "fs"
import path from "path"
import mammoth from "mammoth"
import sanitizeHtml from "sanitize-html"

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

function sanitizeContent(value: string): string {
  const clean = sanitizeHtml(value, {
    allowedTags: [
      "p",
      "b",
      "i",
      "em",
      "strong",
      "h1",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "blockquote",
      "br",
      "hr",
    ],
    allowedAttributes: {
      a: ["href", "name", "target"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  })

  return clean
}

async function docxToHtml(filePath: string): Promise<string> {
  const result = await mammoth.convertToHtml({ path: filePath })

  return sanitizeContent(result.value)
}

export async function listDocuments(req: AuthRequest, res: Response) {
  const userId = req.userId!

  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        attachments: true,
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.documentShare.findMany({
      where: { userId },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            attachments: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { document: { updatedAt: "desc" } },
    }),
  ])

  res.json({
    owned,
    shared: shared.map((s) => ({
      ...s.document,
      permission: s.permission,
    })),
  })
}

export async function getDocument(req: AuthRequest, res: Response) {
  const userId = req.userId!
  const id = req.params.id as string

  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      sharedWith: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      attachments: true,
    },
  })

  if (!doc) {
    res.status(404).json({ error: "Document not found" })
    return
  }

  const isOwner = doc.ownerId === userId
  const share = doc.sharedWith.find((s) => s.userId === userId)

  if (!isOwner && !share) {
    res.status(403).json({ error: "Access denied" })
    return
  }

  res.json({
    document: doc,
    isOwner,
    permission: isOwner ? "edit" : share?.permission,
  })
}

export async function createDocument(req: AuthRequest, res: Response) {
  const userId = req.userId!
  const { title, content } = req.body

  const doc = await prisma.document.create({
    data: {
      title: title || "Untitled Document",
      content: content || "",
      ownerId: userId,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  })

  res.status(201).json({ document: doc })
}

export async function updateDocument(req: AuthRequest, res: Response) {
  const userId = req.userId!
  const id = req.params.id as string
  const { title, content } = req.body

  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) {
    res.status(404).json({ error: "Document not found" })
    return
  }

  const isOwner = doc.ownerId === userId
  const share = await prisma.documentShare.findUnique({
    where: { documentId_userId: { documentId: id, userId } },
  })

  if (!isOwner && share?.permission !== "edit") {
    res.status(403).json({ error: "No edit permission" })
    return
  }

  const updated = await prisma.document.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  })

  res.json({ document: updated })
}

export async function deleteDocument(req: AuthRequest, res: Response) {
  const userId = req.userId!
  const id = req.params.id as string

  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) {
    res.status(404).json({ error: "Document not found" })
    return
  }
  if (doc.ownerId !== userId) {
    res.status(403).json({ error: "Only the owner can delete this document" })
    return
  }

  await prisma.document.delete({ where: { id } })
  res.json({ success: true })
}

export async function uploadFile(req: AuthRequest, res: Response) {
  const userId = req.userId!
  const id = req.params.id as string

  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) {
    res.status(404).json({ error: "Document not found" })
    return
  }

  const isOwner = doc.ownerId === userId
  const share = await prisma.documentShare.findUnique({
    where: { documentId_userId: { documentId: id, userId } },
  })

  if (!isOwner && share?.permission !== "edit") {
    res.status(403).json({ error: "No edit permission" })
    return
  }

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" })
    return
  }

  const file = req.file
  const isTextLike =
    file.mimetype === "text/plain" || file.mimetype === "text/markdown"
  const isDocx = file.mimetype === DOCX_MIME

  let importedContent: string | undefined
  const filePath = path.join(__dirname, "../../uploads", file.filename)
  if (isTextLike) {
    importedContent = sanitizeContent(fs.readFileSync(filePath, "utf-8"))
  } else if (isDocx) {
    importedContent = await docxToHtml(filePath)
  }

  const attachment = await prisma.attachment.create({
    data: {
      documentId: id,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
  })

  res.status(201).json({ attachment, importedContent })
}

export async function deleteAttachment(req: AuthRequest, res: Response) {
  const userId = req.userId!
  const id = req.params.id as string
  const attachmentId = req.params.attachmentId as string

  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) {
    res.status(404).json({ error: "Document not found" })
    return
  }

  const isOwner = doc.ownerId === userId
  const share = await prisma.documentShare.findUnique({
    where: { documentId_userId: { documentId: id, userId } },
  })
  if (!isOwner && share?.permission !== "edit") {
    res.status(403).json({ error: "No edit permission" })
    return
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  })
  if (!attachment || attachment.documentId !== id) {
    res.status(404).json({ error: "Attachment not found" })
    return
  }

  const filePath = path.join(__dirname, "../../uploads", attachment.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  await prisma.attachment.delete({ where: { id: attachmentId } })
  res.json({ success: true })
}

export async function importFileAsDocument(req: AuthRequest, res: Response) {
  const userId = req.userId!

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" })
    return
  }

  const file = req.file
  const isTextLike =
    file.mimetype === "text/plain" || file.mimetype === "text/markdown"
  const isDocx = file.mimetype === DOCX_MIME

  if (!isTextLike && !isDocx) {
    res.status(400).json({
      error: "Only .txt, .md, and .docx files can be imported as documents",
    })
    return
  }

  const filePath = path.join(__dirname, "../../uploads", file.filename)
  let content: string
  if (isDocx) {
    content = await docxToHtml(filePath)
  } else {
    const rawContent = fs.readFileSync(filePath, "utf-8")

    const result = sanitizeContent(rawContent)

    content = `<p>${result
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")}</p>`
  }

  const titleFromName = file.originalname.replace(/\.[^.]+$/, "")

  const doc = await prisma.document.create({
    data: {
      title: titleFromName,
      content,
      ownerId: userId,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  })

  res.status(201).json({ document: doc })
}
