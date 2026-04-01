const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const contentCtrl = require("../controllers/content.controller");

// Lecture accessible à tous les utilisateurs authentifiés
router.get("/", auth, contentCtrl.getAllContent);
router.get("/:id", auth, contentCtrl.getContentById);

// Écriture réservée à l'admin
router.post("/", auth, authorize("admin"), contentCtrl.createContent);
router.put("/:id", auth, authorize("admin"), contentCtrl.updateContent);
router.delete("/:id", auth, authorize("admin"), contentCtrl.deleteContent);

module.exports = router;
