const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/overview", requireAuth, dashboardController.overview);

module.exports = router;
