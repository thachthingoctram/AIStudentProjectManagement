const express = require("express");

const {
    getAIRisks,
    getAIRiskById,
    createAIRisk,
    updateAIRisk,
    deleteAIRisk
} = require("../controllers/aiRiskController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

router.get("/", getAIRisks);
router.get("/:id", getAIRiskById);
router.post("/", createAIRisk);
router.put("/:id", updateAIRisk);
router.delete("/:id", deleteAIRisk);

module.exports = router;