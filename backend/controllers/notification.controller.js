const notifStore = require("../utils/notificationStore");

exports.getUnreadCount = (req, res) => {
  res.json({ count: notifStore.count(req.user.id) });
};

exports.getMyNotifications = (req, res) => {
  res.json(notifStore.getAll(req.user.id));
};

exports.dismiss = (req, res) => {
  notifStore.remove(req.user.id, req.params.id);
  res.json({ message: "Notification supprimée" });
};

exports.dismissAll = (req, res) => {
  notifStore.clearAll(req.user.id);
  res.json({ message: "Toutes les notifications supprimées" });
};
