const express = require("express");

const {
    getTopics,
    getTopicById,
    createTopic,
    updateTopic,
    deleteTopic,
} = require("../controllers/topicController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

router.get("/", getTopics);
router.get("/:id", getTopicById);
router.post("/", createTopic);
router.put("/:id", updateTopic);
router.delete("/:id", deleteTopic);

module.exports = router;
