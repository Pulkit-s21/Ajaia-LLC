import { Router } from "express";
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  uploadFile,
  importFileAsDocument,
} from "../controllers/documentController";
import { shareDocument, revokeShare, listShares } from "../controllers/sharingController";
import { authenticate } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

router.use(authenticate);

router.get("/", listDocuments);
router.post("/", createDocument);
router.post("/import", upload.single("file"), importFileAsDocument);

router.get("/:id", getDocument);
router.patch("/:id", updateDocument);
router.delete("/:id", deleteDocument);

router.post("/:id/upload", upload.single("file"), uploadFile);

router.get("/:id/shares", listShares);
router.post("/:id/shares", shareDocument);
router.delete("/:id/shares/:shareId", revokeShare);

export default router;
