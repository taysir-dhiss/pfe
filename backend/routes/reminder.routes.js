const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const reminderCtrl = require("../controllers/reminder.controller");

const isPatient = [auth, authorize("patiente")];

router.get("/",             isPatient, reminderCtrl.getMyReminders);
router.post("/",            isPatient, reminderCtrl.createReminder);
router.put("/:id",          isPatient, reminderCtrl.updateReminder);
router.patch("/:id/toggle", isPatient, reminderCtrl.toggleReminder);
router.delete("/:id",       isPatient, reminderCtrl.deleteReminder);

module.exports = router;
