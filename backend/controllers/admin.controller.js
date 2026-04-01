// CRUD operations on Admin accounts + patient management + stats
const Admin = require("../models/Admin");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Symptom = require("../models/Symptom");
const bcrypt = require("bcryptjs");

// ─── Admin profile ────────────────────────────────────────────────────────────

exports.getMyProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-motDePasse");
    if (!admin) return res.status(404).json({ message: "Admin introuvable" });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { motDePasse, role, ...data } = req.body;
    const admin = await Admin.findByIdAndUpdate(req.user.id, data, {
      new: true,
      runValidators: true
    }).select("-motDePasse");
    if (!admin) return res.status(404).json({ message: "Admin introuvable" });
    res.json(admin);
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

    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin introuvable" });

    const valid = await bcrypt.compare(ancienMotDePasse, admin.motDePasse);
    if (!valid) return res.status(401).json({ message: "Ancien mot de passe incorrect" });

    admin.motDePasse = await bcrypt.hash(nouveauMotDePasse, 10);
    await admin.save();
    res.json({ message: "Mot de passe mis à jour" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ─── Admin CRUD (manage all admins) ──────────────────────────────────────────

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-motDePasse").sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-motDePasse");
    if (!admin) return res.status(404).json({ message: "Admin introuvable" });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { motDePasse, role, ...data } = req.body;
    const admin = await Admin.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    }).select("-motDePasse");
    if (!admin) return res.status(404).json({ message: "Admin introuvable" });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin introuvable" });
    res.json({ message: "Admin supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ─── Patient management (admin perspective) ──────────────────────────────────

exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().select("-motDePasse").sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select("-motDePasse");
    if (!patient) return res.status(404).json({ message: "Patient introuvable" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const { motDePasse, role, ...data } = req.body;
    const patient = await Patient.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    }).select("-motDePasse");
    if (!patient) return res.status(404).json({ message: "Patient introuvable" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient introuvable" });
    res.json({ message: "Patient supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ─── Stats ────────────────────────────────────────────────────────────────────

exports.getStats = async (req, res) => {
  try {
    const [patientCount, appointmentCount, symptomCount, adminCount] = await Promise.all([
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Symptom.countDocuments(),
      Admin.countDocuments()
    ]);
    res.json({ patientCount, appointmentCount, symptomCount, adminCount });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
