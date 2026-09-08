const express = require("express");

const {
    getTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
} = require("../controllers/teacherController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

// Chỉ Admin quản lý giảng viên
router.use(authorizeRoles("Admin"));

router.get("/", getTeachers);
router.get("/:id", getTeacherById);
router.post("/", createTeacher);
router.put("/:id", updateTeacher);
router.delete("/:id", deleteTeacher);

module.exports = router;
