const express = require("express");

const {
    getProgresses,
    getProgressById,
    createProgress,
    updateProgress,
    deleteProgress,
} = require("../controllers/progressController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

router.get("/", getProgresses);
router.get("/:id", getProgressById);
router.post("/", createProgress);
router.put("/:id", updateProgress);
router.delete("/:id", deleteProgress);

module.exports = router;
