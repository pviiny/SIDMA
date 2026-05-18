const express = require("express");
const denunciaController = require("../controllers/denunciaController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, denunciaController.list);
router.get("/:id", requireAuth, denunciaController.show);
router.post("/", denunciaController.create);
router.put("/:id", requireAuth, denunciaController.update);
router.delete("/:id", requireAuth, denunciaController.remove);

module.exports = router;
