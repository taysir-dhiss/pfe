// Routes RAG (Retrieval-Augmented Generation) — gestion de la base de connaissances médicales
// Réservées aux administrateurs : upload de PDF, liste et suppression des documents indexés
const express  = require("express");
const multer   = require("multer"); // Middleware pour gérer les uploads de fichiers
const router   = express.Router();
const auth     = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ragCtrl  = require("../controllers/rag.controller");

const isAdmin = [auth, authorize("admin")];

// Configuration de Multer : stockage en mémoire RAM (buffer) — pas de fichier temporaire sur disque
// Le buffer est transmis directement à pdf-parse pour extraction du texte
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 25 * 1024 * 1024 }, // Taille maximale du PDF : 25 Mo
  fileFilter: (_req, file, cb) => {
    // Accepte uniquement les fichiers PDF
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Seuls les fichiers PDF sont acceptés."), false);
  },
});

// Upload et indexation d'un PDF — extrait le texte, le découpe en chunks et génère les embeddings
router.post(  "/upload",                 isAdmin, upload.single("pdf"), ragCtrl.uploadDocument);
// Liste tous les documents indexés (agrégés par sourceId)
router.get(   "/documents",              isAdmin, ragCtrl.listDocuments);
// Supprime tous les chunks d'un document identifié par son sourceId
router.delete("/documents/:sourceId",    isAdmin, ragCtrl.deleteDocument);

module.exports = router;
