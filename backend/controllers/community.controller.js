const CommunityMessage = require("../models/CommunityMessage");
const Patient = require("../models/Patient");
const { getIO } = require("../socket");

// GET /api/community/messages — initial load: top-level + nested replies
exports.getMessages = async (req, res) => {
  try {
    const topLevel = await CommunityMessage.find({ parentMessageId: null })
      .sort({ createdAt: 1 })
      .lean();

    const topIds = topLevel.map((m) => m._id);
    const replies = await CommunityMessage.find({ parentMessageId: { $in: topIds } })
      .sort({ createdAt: 1 })
      .lean();

    const repliesByParent = {};
    replies.forEach((r) => {
      const key = r.parentMessageId.toString();
      if (!repliesByParent[key]) repliesByParent[key] = [];
      repliesByParent[key].push(serialize(r));
    });

    const result = topLevel.map((m) => ({
      ...serialize(m),
      replies: repliesByParent[m._id.toString()] || [],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/community/messages — patiente only
exports.postMessage = async (req, res) => {
  try {
    const { content, parentMessageId } = req.body;
    if (!content?.trim())
      return res.status(400).json({ message: "Le message ne peut pas être vide." });

    const patient = await Patient.findById(req.user.id).select("nom");

    const doc = await CommunityMessage.create({
      userId: req.user.id,
      username: patient?.nom || "Patient",
      userRole: "patiente",
      content: content.trim(),
      parentMessageId: parentMessageId || null,
      reactions: {},
    });

    const msg = { ...serialize(doc.toObject()), replies: [] };

    // Broadcast to every connected client in the community room
    getIO().to("community").emit("community:message", msg);

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/community/messages/:id/react — toggle emoji, patiente only
exports.reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const ALLOWED = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
    if (!ALLOWED.includes(emoji))
      return res.status(400).json({ message: "Emoji non autorisé." });

    const msg = await CommunityMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message introuvable." });

    const userId = req.user.id.toString();
    const users = msg.reactions.get(emoji) || [];

    if (users.includes(userId)) {
      const updated = users.filter((u) => u !== userId);
      if (updated.length === 0) msg.reactions.delete(emoji);
      else msg.reactions.set(emoji, updated);
    } else {
      msg.reactions.set(emoji, [...users, userId]);
    }

    await msg.save();

    const payload = {
      messageId: msg._id.toString(),
      parentMessageId: msg.parentMessageId?.toString() || null,
      reactions: Object.fromEntries(msg.reactions),
    };

    getIO().to("community").emit("community:reaction", payload);

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/community/messages/:id — own message only, patiente only
exports.deleteMessage = async (req, res) => {
  try {
    const msg = await CommunityMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message introuvable." });
    if (msg.userId.toString() !== req.user.id.toString())
      return res.status(403).json({ message: "Vous ne pouvez supprimer que vos propres messages." });

    await CommunityMessage.deleteMany({ parentMessageId: msg._id });
    await msg.deleteOne();

    const payload = {
      messageId: req.params.id,
      parentMessageId: msg.parentMessageId?.toString() || null,
    };

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
