const express = require("express");

const {
    getClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
} = require("../controllers/classController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

// Admin quản lý lớp
router.use(authorizeRoles("Admin"));

router.get("/", getClasses);
router.get("/:id", getClassById);
router.post("/", createClass);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);

module.exports = router;
