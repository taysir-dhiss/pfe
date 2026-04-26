// Reminder controller — patient CRUD for custom alarms (medication reminders, etc.)
const CustomReminder = require("../models/CustomReminder");

// GET /api/reminders
exports.getMyReminders = async (req, res) => {
  try {
    const reminders = await CustomReminder.find({ patientId: req.user.id }).sort({ createdAt: -1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// POST /api/reminders
exports.createReminder = async (req, res) => {
  try {
    const { label, repeatType, days, time, date } = req.body;
    if (!label || !repeatType)
      return res.status(400).json({ message: "label et repeatType sont obligatoires" });
    if (repeatType === "once" && !date)
      return res.status(400).json({ message: "date est obligatoire pour un rappel unique" });
    if ((repeatType === "daily" || repeatType === "weekly") && !time)
      return res.status(400).json({ message: "time est obligatoire pour ce type de rappel" });
    if (repeatType === "weekly" && (!days || days.length === 0))
      return res.status(400).json({ message: "Sélectionnez au moins un jour de la semaine" });

    const reminder = await CustomReminder.create({
      patientId: req.user.id,
      label,
      repeatType,
      days: days || [],
      time: time || null,
      date: date ? new Date(date) : null
    });
    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/reminders/:id
exports.updateReminder = async (req, res) => {
  try {
    const { label, repeatType, days, time, date, active } = req.body;
    const reminder = await CustomReminder.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user.id },
      { label, repeatType, days, time, date: date ? new Date(date) : null, active, lastFiredAt: null },
      { new: true, runValidators: true }
    );
    if (!reminder) return res.status(404).json({ message: "Rappel introuvable" });
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// PATCH /api/reminders/:id/toggle
exports.toggleReminder = async (req, res) => {
  try {
    const reminder = await CustomReminder.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!reminder) return res.status(404).json({ message: "Rappel introuvable" });
    reminder.active = !reminder.active;
    await reminder.save();
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// DELETE /api/reminders/:id
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await CustomReminder.findOneAndDelete({ _id: req.params.id, patientId: req.user.id });
    if (!reminder) return res.status(404).json({ message: "Rappel introuvable" });
    res.json({ message: "Rappel supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
