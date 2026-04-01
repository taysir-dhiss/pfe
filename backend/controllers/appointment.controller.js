// CRUD rendez-vous patient + gestion statut admin
const Appointment = require("../models/Appointment");

// POST /api/appointments
exports.createAppointment = async (req, res) => {
  try {
    const { type, date, medecin } = req.body;
    if (!date) {
      return res.status(400).json({ message: "La date est obligatoire" });
    }
    const appointment = await Appointment.create({
      type,
      date,
      medecin,
      patientId: req.user.id,
      status: "pending"
    });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/appointments
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id }).sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/appointments/:id
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!appointment) return res.status(404).json({ message: "Rendez-vous introuvable" });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/appointments/:id
exports.updateAppointment = async (req, res) => {
  try {
    const { status, patientId, ...data } = req.body;
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user.id },
      data,
      { new: true, runValidators: true }
    );
    if (!appointment) return res.status(404).json({ message: "Rendez-vous introuvable" });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// DELETE /api/appointments/:id
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, patientId: req.user.id });
    if (!appointment) return res.status(404).json({ message: "Rendez-vous introuvable" });
    res.json({ message: "Rendez-vous supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/admin/appointments  (admin)
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patientId", "nom email")
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/admin/appointments/:id/status  (admin)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: "Rendez-vous introuvable" });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
