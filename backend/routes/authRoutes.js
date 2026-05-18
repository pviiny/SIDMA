const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.get("/usuarios", requireAuth, authController.listUsers);
router.post("/usuarios", requireAuth, authController.createAdmin);

module.exports = router;
