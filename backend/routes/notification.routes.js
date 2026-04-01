const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const notificationCtrl = require("../controllers/notification.controller");

const isPatient = [auth, authorize("patiente")];

router.get("/", isPatient, notificationCtrl.getMyNotifications);
router.put("/:id/read", isPatient, notificationCtrl.markAsRead);
router.delete("/:id", isPatient, notificationCtrl.deleteNotification);

module.exports = router;
