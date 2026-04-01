// CRUD notifications - envoi admin, lecture patient
const Notification = require("../models/Notification");

// POST /api/admin/notifications  (admin)
exports.createNotification = async (req, res) => {
  try {
    const { patientId, message } = req.body;
    if (!patientId || !message) {
      return res.status(400).json({ message: "patientId et message sont obligatoires" });
    }
    const notification = await Notification.create({ patientId, message });
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/notifications  (patient)
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ patientId: req.user.id }).sort({ dateEnvoi: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/notifications/:id/read  (patient)
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, patientId: req.user.id },
      { statut: "lu" },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification introuvable" });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// DELETE /api/notifications/:id  (patient)
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, patientId: req.user.id });
    if (!notification) return res.status(404).json({ message: "Notification introuvable" });
    res.json({ message: "Notification supprimée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// GET /api/admin/notifications  (admin)
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("patientId", "nom email")
      .sort({ dateEnvoi: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// DELETE /api/admin/notifications/:id  (admin)
exports.adminDeleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification introuvable" });
    res.json({ message: "Notification supprimée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};
