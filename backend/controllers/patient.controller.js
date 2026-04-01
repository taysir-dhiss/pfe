// CRUD operations for Patient (own profile + admin access)
const Patient = require("../models/Patient");
const bcrypt = require("bcryptjs");

// ─── Patient: own profile ─────────────────────────────────────────────────────

exports.getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select("-motDePasse");
    if (!patient) return res.status(404).json({ message: "Patient introuvable" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { motDePasse, role, ...data } = req.body;
    const patient = await Patient.findByIdAndUpdate(req.user.id, data, {
      new: true,
      runValidators: true
    }).select("-motDePasse");
    if (!patient) return res.status(404).json({ message: "Patient introuvable" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.changeMyPassword = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({ message: "Les deux mots de passe sont obligatoires" });
    }
    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caractères" });
    }

    const patient = await Patient.findById(req.user.id);
    if (!patient) return res.status(404).json({ message: "Patient introuvable" });

    const valid = await bcrypt.compare(ancienMotDePasse, patient.motDePasse);
    if (!valid) return res.status(401).json({ message: "Ancien mot de passe incorrect" });

    patient.motDePasse = await bcrypt.hash(nouveauMotDePasse, 10);
    await patient.save();
    res.json({ message: "Mot de passe mis à jour" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.deleteMyAccount = async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.user.id);
    res.json({ message: "Compte supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
