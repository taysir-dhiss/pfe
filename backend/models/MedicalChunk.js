// Modèle MedicalChunk — fragment de texte médical extrait d'un PDF et vectorisé pour le RAG
// Chaque document PDF est découpé en plusieurs chunks qui sont stockés ici avec leurs embeddings
const mongoose = require("mongoose");

const medicalChunkSchema = new mongoose.Schema(
  {
    sourceFile: { type: String, required: true },                                       // Nom original du fichier PDF
    sourceId:   { type: String, required: true, index: true },                         // UUID unique du document parent (regroupe tous ses chunks)
    chunkIndex: { type: Number, required: true },                                       // Position ordinale du chunk dans le document
    text:       { type: String, required: true },                                       // Texte brut du fragment
    embedding:  { type: [Number], default: [] },                                        // Vecteur d'embedding généré par OpenAI (text-embedding-3-small)
    charCount:  { type: Number },                                                       // Nombre de caractères du fragment (pour monitoring)
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },                // Admin qui a uploadé le document
  },
  { timestamps: true }
);

// Index composé pour supprimer efficacement tous les chunks d'un document en une seule requête
medicalChunkSchema.index({ sourceId: 1, chunkIndex: 1 });

module.exports = mongoose.model("MedicalChunk", medicalChunkSchema);
