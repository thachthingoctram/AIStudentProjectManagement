const express = require("express");

const {
    getNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
} = require("../controllers/notificationController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

router.get("/", getNotifications);
router.get("/:id", getNotificationById);
router.post("/", createNotification);
router.put("/:id", updateNotification);
router.delete("/:id", deleteNotification);

module.exports = router;
