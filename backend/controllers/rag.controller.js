const crypto       = require("crypto");
const pdfParse     = require("pdf-parse");
const MedicalChunk = require("../models/MedicalChunk");
const RAGService   = require("../services/RAGService");

// Upload d'un PDF + indexation complète : extraction texte → découpage → embedding → stockage
// Tout se passe en une seule requête HTTP, ce qui peut prendre 10-30s pour un PDF dense
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni." });
    }
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ message: "Seuls les fichiers PDF sont acceptés." });
    }

    // UUID unique qui identifie ce document — tous ses chunks partagent ce même sourceId
    // C'est ce qui permet de supprimer un document entier en une seule requête deleteMany
    const sourceId   = crypto.randomUUID();
    const sourceFile = req.file.originalname;

    // Le fichier arrive en buffer mémoire (Multer memoryStorage) — on le passe directement à pdf-parse
    // Si le PDF est protégé par mot de passe ou scanné sans OCR, pdf-parse lève une exception
    let pdfData;
    try {
      pdfData = await pdfParse(req.file.buffer);
    } catch {
      return res.status(422).json({ message: "Impossible de lire le PDF. Vérifiez que le fichier n'est pas protégé." });
    }

    const rawText = pdfData.text?.trim();

    // Moins de 100 caractères = très probablement un PDF image (scan sans OCR) ou un fichier vide
    // Inutile de continuer — aucun chunk exploitable ne sortira de là
    if (!rawText || rawText.length < 100) {
      return res.status(422).json({ message: "Le PDF ne contient pas assez de texte exploitable (PDF image ou protégé ?)." });
    }

    const chunks = RAGService.chunkText(rawText);
    if (!chunks.length) {
      return res.status(422).json({ message: "Aucun contenu exploitable après découpage." });
    }

    // storeChunks génère les embeddings (appels OpenAI) et persiste tout en base
    // req.user.id permet de savoir quel admin a indexé ce document
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

// Il n'y a pas de collection "Document" en base — un document c'est juste un groupe de chunks
// On reconstitue la liste via une agrégation MongoDB : on regroupe les chunks par sourceId
exports.listDocuments = async (req, res) => {
  try {
    const docs = await MedicalChunk.aggregate([
      {
        $group: {
          _id:        "$sourceId",
          sourceFile: { $first: "$sourceFile" },
          chunkCount: { $sum: 1 },          // nombre de chunks = taille approximative du document
          uploadedBy: { $first: "$uploadedBy" },
          createdAt:  { $min: "$createdAt" }, // date du premier chunk = date d'indexation
        },
      },
      { $sort: { createdAt: -1 } },          // les plus récents en premier
    ]);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Supprimer un document = supprimer tous ses chunks — pas d'entité document à effacer séparément
exports.deleteDocument = async (req, res) => {
  try {
    const result = await MedicalChunk.deleteMany({ sourceId: req.params.sourceId });

    // Si aucun chunk trouvé pour ce sourceId, le document n'existe pas (ou déjà supprimé)
    if (!result.deletedCount) {
      return res.status(404).json({ message: "Document introuvable." });
    }

    res.json({ message: `Document supprimé (${result.deletedCount} chunks effacés).` });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
