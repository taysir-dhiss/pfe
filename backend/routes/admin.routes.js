const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// Sample admin-only endpoints
router.get("/stats", auth, authorize("admin"), (req, res) => {
  res.json({ message: "Admin stats endpoint (placeholder)" });
});

router.get("/users", auth, authorize("admin"), (req, res) => {
  res.json({ message: "Admin user management endpoint (placeholder)" });
});

module.exports = router;
