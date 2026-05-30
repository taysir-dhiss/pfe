const crypto       = require("crypto");
const pdfParse     = require("pdf-parse");
const MedicalChunk = require("../models/MedicalChunk");
const RAGService   = require("../services/RAGService");

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni." });
    }
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ message: "Seuls les fichiers PDF sont acceptés." });
    }

    const sourceId   = crypto.randomUUID();
    const sourceFile = req.file.originalname;

    let pdfData;
    try {
      pdfData = await pdfParse(req.file.buffer);
    } catch {
      return res.status(422).json({ message: "Impossible de lire le PDF. Vérifiez que le fichier n'est pas protégé." });
    }

    const rawText = pdfData.text?.trim();
    if (!rawText || rawText.length < 100) {
      return res.status(422).json({ message: "Le PDF ne contient pas assez de texte exploitable (PDF image ou protégé ?)." });
    }

    const chunks = RAGService.chunkText(rawText);
    if (!chunks.length) {
      return res.status(422).json({ message: "Aucun contenu exploitable après découpage." });
    }

    const chunkCount = await RAGService.storeChunks(chunks, sourceFile, sourceId, req.user.id);

    res.status(201).json({
      message:    `Document indexé avec succès.`,
      sourceId,
      sourceFile,
      chunkCount,
      pages:      pdfData.numpages,
    });
  } catch (err) {
    console.error("[RAG] uploadDocument error:", err.message);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.listDocuments = async (req, res) => {
  try {
    const docs = await MedicalChunk.aggregate([
      {
        $group: {
          _id:        "$sourceId",
          sourceFile: { $first: "$sourceFile" },
          chunkCount: { $sum: 1 },
          uploadedBy: { $first: "$uploadedBy" },
          createdAt:  { $min: "$createdAt" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const result = await MedicalChunk.deleteMany({ sourceId: req.params.sourceId });
    if (!result.deletedCount) {
      return res.status(404).json({ message: "Document introuvable." });
    }
    res.json({ message: `Document supprimé (${result.deletedCount} chunks effacés).` });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
