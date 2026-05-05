// Contrôleur du chat communautaire — messages, réponses imbriquées, réactions emoji
// Toutes les mutations sont diffusées en temps réel via Socket.io à la salle "community"
const CommunityMessage = require("../models/CommunityMessage");
const Patient = require("../models/Patient");
const { getIO } = require("../socket"); // Instance Socket.io pour diffuser les événements en temps réel

// GET /api/community/messages — chargement initial : messages principaux + leurs réponses imbriquées
exports.getMessages = async (req, res) => {
  try {
    // Récupère tous les messages de premier niveau (sans parent) triés par date croissante
    const topLevel = await CommunityMessage.find({ parentMessageId: null })
      .sort({ createdAt: 1 })
      .lean();

    const topIds = topLevel.map((m) => m._id);
    // Récupère toutes les réponses aux messages principaux en une seule requête
    const replies = await CommunityMessage.find({ parentMessageId: { $in: topIds } })
      .sort({ createdAt: 1 })
      .lean();

    // Regroupe les réponses par ID du message parent pour faciliter l'assemblage
    const repliesByParent = {};
    replies.forEach((r) => {
      const key = r.parentMessageId.toString();
      if (!repliesByParent[key]) repliesByParent[key] = [];
      repliesByParent[key].push(serialize(r));
    });

    // Assemble la réponse finale : chaque message de premier niveau avec ses réponses imbriquées
    const result = topLevel.map((m) => ({
      ...serialize(m),
      replies: repliesByParent[m._id.toString()] || [],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/community/messages — accessible aux patientes uniquement
exports.postMessage = async (req, res) => {
  try {
    const { content, parentMessageId } = req.body;
    if (!content?.trim())
      return res.status(400).json({ message: "Le message ne peut pas être vide." });

    // Récupère le nom de la patiente pour l'afficher dans le message
    const patient = await Patient.findById(req.user.id).select("nom");

    const doc = await CommunityMessage.create({
      userId: req.user.id,
      username: patient?.nom || "Patient",
      userRole: "patiente",
      content: content.trim(),
      parentMessageId: parentMessageId || null, // null = message principal, sinon = réponse
      reactions: {},
    });

    const msg = { ...serialize(doc.toObject()), replies: [] };

    // Diffuse le nouveau message à tous les clients connectés dans la salle communautaire
    getIO().to("community").emit("community:message", msg);

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/community/messages/:id/react — ajoute ou retire une réaction emoji (toggle), patientes seulement
exports.reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    // Liste blanche des emojis autorisés pour éviter les abus
    const ALLOWED = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
    if (!ALLOWED.includes(emoji))
      return res.status(400).json({ message: "Emoji non autorisé." });

    const msg = await CommunityMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message introuvable." });

    const userId = req.user.id.toString();
    const users = msg.reactions.get(emoji) || [];

    // Logique de toggle : si l'utilisateur a déjà réagi, on retire sa réaction, sinon on l'ajoute
    if (users.includes(userId)) {
      const updated = users.filter((u) => u !== userId);
      if (updated.length === 0) msg.reactions.delete(emoji); // Supprime la clé si aucun réacteur restant
      else msg.reactions.set(emoji, updated);
    } else {
      msg.reactions.set(emoji, [...users, userId]);
    }

    await msg.save();

    const payload = {
      messageId: msg._id.toString(),
      parentMessageId: msg.parentMessageId?.toString() || null,
      reactions: Object.fromEntries(msg.reactions), // Convertit la Map en objet JSON sérialisable
    };

    // Diffuse la mise à jour des réactions à tous les clients connectés
    getIO().to("community").emit("community:reaction", payload);

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/community/messages/:id — supprime uniquement ses propres messages, patientes seulement
exports.deleteMessage = async (req, res) => {
  try {
    const msg = await CommunityMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message introuvable." });
    // Vérifie que la patiente ne peut supprimer que ses propres messages
    if (msg.userId.toString() !== req.user.id.toString())
      return res.status(403).json({ message: "Vous ne pouvez supprimer que vos propres messages." });

    // Supprime d'abord toutes les réponses au message, puis le message lui-même
    await CommunityMessage.deleteMany({ parentMessageId: msg._id });
    await msg.deleteOne();

    const payload = {
      messageId: req.params.id,
      parentMessageId: msg.parentMessageId?.toString() || null,
    };

    // Notifie tous les clients connectés de la suppression pour mise à jour de l'interface
    getIO().to("community").emit("community:delete", payload);

    res.json({ message: "Message supprimé." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Serialize Mongoose Map → plain object ──────────────────────────────────
function serialize(doc) {
  return {
    ...doc,
    _id: doc._id?.toString(),
    userId: doc.userId?.toString(),
    reactions: doc.reactions instanceof Map
      ? Object.fromEntries(doc.reactions)
      : (doc.reactions || {}),
  };
}
