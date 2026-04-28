// CRUD symptômes patient + vue admin + déclenchement recommandations IA
const Symptom = require("../models/Symptom");

// POST /api/symptoms
exports.createSymptom = async (req, res) => {
  try {
    const { type, intensite, dateDeclaration } = req.body;
    if (!type || intensite === undefined) {
      return res.status(400).json({ message: "type et intensite sont obligatoires" });
    }
    const symptom = await Symptom.create({
      type,
      intensite,
      dateDeclaration: dateDeclaration || Date.now(),
      patientId: req.user.id
    });
    res.status(201).json(symptom);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/symptoms
exports.getMySymptoms = async (req, res) => {
  try {
    const symptoms = await Symptom.find({ patientId: req.user.id }).sort({ dateDeclaration: -1 });
    res.json(symptoms);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/symptoms/:id
exports.getSymptomById = async (req, res) => {
  try {
    const symptom = await Symptom.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!symptom) return res.status(404).json({ message: "Symptôme introuvable" });
    res.json(symptom);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/symptoms/:id
exports.updateSymptom = async (req, res) => {
  try {
    const { patientId, ...data } = req.body;
    const symptom = await Symptom.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user.id },
      data,
      { new: true, runValidators: true }
    );
    if (!symptom) return res.status(404).json({ message: "Symptôme introuvable" });
    res.json(symptom);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// DELETE /api/symptoms/:id  (idempotent — 200 even if already gone)
exports.deleteSymptom = async (req, res) => {
  try {
    await Symptom.findOneAndDelete({ _id: req.params.id, patientId: req.user.id });
    res.json({ message: "Symptôme supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/admin/symptoms  (admin)
exports.getAllSymptoms = async (req, res) => {
  try {
    const symptoms = await Symptom.find()
      .populate("patientId", "nom email stadeCancer")
      .sort({ dateDeclaration: -1 });
    res.json(symptoms);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
