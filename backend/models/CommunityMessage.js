// Modèle CommunityMessage — message posté dans le chat communautaire
// Supporte les réponses imbriquées (parentMessageId) et les réactions emoji
const mongoose = require("mongoose");

const communityMessageSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, required: true },              // ID de l'auteur
    username:        { type: String, required: true },                                      // Nom affiché de l'auteur
    userRole:        { type: String, enum: ["patiente", "admin"], required: true },         // Rôle de l'auteur
    content:         { type: String, required: true, maxlength: 2000 },                     // Contenu du message (max 2000 caractères)
    // Map emoji → tableau d'IDs utilisateurs ayant réagi (ex: { "👍": ["userId1", "userId2"] })
    reactions:       { type: Map, of: [String], default: {} },
    // Si non null, ce message est une réponse à un autre message (structure en fils de discussion)
    parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityMessage", default: null },
  },
  { timestamps: true }
);

// Index composé pour récupérer efficacement les réponses d'un message parent, triées par date
communityMessageSchema.index({ parentMessageId: 1, createdAt: 1 });

module.exports = mongoose.model("CommunityMessage", communityMessageSchema);
