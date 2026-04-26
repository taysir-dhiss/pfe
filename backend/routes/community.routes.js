const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const ctrl = require("../controllers/community.controller");

const isAuthenticated = [auth];
const isPatient = [auth, authorize("patiente")];

// Anyone authenticated can read
router.get("/messages", isAuthenticated, ctrl.getMessages);

// Only patients can write / react / delete
router.post("/messages", isPatient, ctrl.postMessage);
router.post("/messages/:id/react", isPatient, ctrl.reactToMessage);
router.delete("/messages/:id", isPatient, ctrl.deleteMessage);

module.exports = router;
