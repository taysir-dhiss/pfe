// Notification controller — in-memory store, no DB
const notifStore = require("../utils/notificationStore");

// GET /api/notifications/unread-count
exports.getUnreadCount = (req, res) => {
  res.json({ count: notifStore.count(req.user.id) });
};

// GET /api/notifications
exports.getMyNotifications = (req, res) => {
  res.json(notifStore.getAll(req.user.id));
};

// DELETE /api/notifications/:id  — dismiss one (marks as read + removes)
exports.dismiss = (req, res) => {
  notifStore.remove(req.user.id, req.params.id);
  res.json({ message: "Notification supprimée" });
};

// DELETE /api/notifications  — dismiss all
exports.dismissAll = (req, res) => {
  notifStore.clearAll(req.user.id);
  res.json({ message: "Toutes les notifications supprimées" });
};
