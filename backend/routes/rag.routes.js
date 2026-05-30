const express  = require("express");
const multer   = require("multer");
const router   = express.Router();
const auth     = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ragCtrl  = require("../controllers/rag.controller");

const isAdmin = [auth, authorize("admin")];

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Seuls les fichiers PDF sont acceptés."), false);
  },
});

router.post(  "/upload",                 isAdmin, upload.single("pdf"), ragCtrl.uploadDocument);
router.get(   "/documents",              isAdmin, ragCtrl.listDocuments);
router.delete("/documents/:sourceId",    isAdmin, ragCtrl.deleteDocument);

module.exports = router;
