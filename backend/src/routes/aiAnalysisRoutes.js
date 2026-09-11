const express = require("express");

const {
    getAIAnalyses,
    getAIAnalysisById,
    createAIAnalysis,
    updateAIAnalysis,
    deleteAIAnalysis,
} = require("../controllers/aiAnalysisController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

router.get("/", getAIAnalyses);
router.get("/:id", getAIAnalysisById);
router.post("/", createAIAnalysis);
router.put("/:id", updateAIAnalysis);
router.delete("/:id", deleteAIAnalysis);

module.exports = router;
