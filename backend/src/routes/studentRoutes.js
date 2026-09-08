const express = require("express");

const {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
} = require("../controllers/studentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Tất cả API Students yêu cầu đăng nhập
router.use(authenticateToken);

// Chỉ Admin được quản lý sinh viên
router.use(authorizeRoles("Admin"));

router.get("/", getStudents);
router.get("/:id", getStudentById);
router.post("/", createStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

module.exports = router;
