const express = require("express");

const {
    getChatHistories,
    getChatHistoryById,
    createChatHistory,
    updateChatHistory,
    deleteChatHistory
} = require("../controllers/aiChatHistoryController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

router.get("/", getChatHistories);
router.get("/:id", getChatHistoryById);
router.post("/", createChatHistory);
router.put("/:id", updateChatHistory);
router.delete("/:id", deleteChatHistory);

module.exports = router;