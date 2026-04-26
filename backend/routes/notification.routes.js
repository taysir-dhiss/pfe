const express   = require("express");
const router    = express.Router();
const auth      = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ctrl      = require("../controllers/notification.controller");

const isPatient = [auth, authorize("patiente")];

router.get("/unread-count", isPatient, ctrl.getUnreadCount);
router.get("/",             isPatient, ctrl.getMyNotifications);
router.delete("/",          isPatient, ctrl.dismissAll);
router.delete("/:id",       isPatient, ctrl.dismiss);

module.exports = router;
