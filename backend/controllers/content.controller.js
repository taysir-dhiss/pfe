// CRUD contenu médical (articles et vidéos) - écriture admin, lecture tous
const MedicalContent = require("../models/MedicalContent");

// POST /api/content  (admin)
exports.createContent = async (req, res) => {
  try {
    const { titre, type, contenu, url } = req.body;
    if (!titre || !type) {
      return res.status(400).json({ message: "titre et type sont obligatoires" });
    }
    if (type === "video" && !url) {
      return res.status(400).json({ message: "url est obligatoire pour une vidéo" });
    }
    if (type === "article" && !contenu) {
      return res.status(400).json({ message: "contenu est obligatoire pour un article" });
    }
    const content = await MedicalContent.create({ titre, type, contenu, url, createdBy: req.user.id });
    res.status(201).json(content);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/content  (tous)
exports.getAllContent = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};
    const content = await MedicalContent.find(filter)
      .populate("createdBy", "nom")
      .sort({ createdAt: -1 });
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/content/:id  (tous)
exports.getContentById = async (req, res) => {
  try {
    const content = await MedicalContent.findById(req.params.id).populate("createdBy", "nom");
    if (!content) return res.status(404).json({ message: "Contenu introuvable" });
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/content/:id  (admin)
exports.updateContent = async (req, res) => {
  try {
    const { createdBy, ...data } = req.body;
    const content = await MedicalContent.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });
    if (!content) return res.status(404).json({ message: "Contenu introuvable" });
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// DELETE /api/content/:id  (admin)
exports.deleteContent = async (req, res) => {
  try {
    const content = await MedicalContent.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ message: "Contenu introuvable" });
    res.json({ message: "Contenu supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
