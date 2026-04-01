// Recommendation controller - lecture des recommandations IA par patient et admin
const Recommendation = require("../models/Recommendation");

// GET /api/recommendations  (patient: ses recommandations)
exports.getMyRecommendations = async (req, res) => {
  try {
    const recommendations = await Recommendation.find({ patientId: req.user.id })
      .populate("symptomId", "type intensite dateDeclaration")
      .sort({ dateGeneration: -1 });
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/recommendations/:id  (patient)
exports.getRecommendationById = async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({
      _id: req.params.id,
      patientId: req.user.id
    }).populate("symptomId", "type intensite dateDeclaration");
    if (!recommendation) return res.status(404).json({ message: "Recommandation introuvable" });
    res.json(recommendation);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/admin/recommendations  (admin: toutes)
exports.getAllRecommendations = async (req, res) => {
  try {
    const recommendations = await Recommendation.find()
      .populate("patientId", "nom email stadeCancer")
      .populate("symptomId", "type intensite")
      .sort({ dateGeneration: -1 });
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// DELETE /api/admin/recommendations/:id  (admin)
exports.deleteRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findByIdAndDelete(req.params.id);
    if (!recommendation) return res.status(404).json({ message: "Recommandation introuvable" });
    res.json({ message: "Recommandation supprimée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
