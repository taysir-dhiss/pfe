const Appointment = require("../models/Appointment");

const fmtTime = d => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const fmtDate = d => new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

exports.createAppointment = async (req, res) => {
  try {
    const { type, date, medecin, customReminderDate } = req.body;
    if (!date) return res.status(400).json({ message: "La date est obligatoire" });

    const appointment = await Appointment.create({
      patientId: req.user.id,
      type,
      date,
      medecin,
      customReminderDate: customReminderDate || null
    });

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id }).sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!appointment) return res.status(404).json({ message: "Rendez-vous introuvable" });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { patientId, reminderSent, customReminderSent, ...data } = req.body;

    const existing = await Appointment.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!existing) return res.status(404).json({ message: "Rendez-vous introuvable" });

    if (data.date && new Date(data.date).getTime() !== existing.date.getTime()) {
      data.reminderSent = false;
    }

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, patientId: req.user.id });
    if (!appointment) return res.status(404).json({ message: "Rendez-vous introuvable" });
    res.json({ message: "Rendez-vous supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.setCustomReminder = async (req, res) => {
  try {
    const { customReminderDate } = req.body;
    if (!customReminderDate) return res.status(400).json({ message: "La date de rappel est obligatoire" });

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user.id },
      { customReminderDate: new Date(customReminderDate), customReminderSent: false },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: "Rendez-vous introuvable" });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

exports.removeCustomReminder = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user.id },
      { customReminderDate: null, customReminderSent: false },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: "Rendez-vous introuvable" });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
