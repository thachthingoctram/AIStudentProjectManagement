const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// API dành cho mọi user đã đăng nhập
router.get("/profile", authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: "Xác thực JWT thành công",
        data: {
            user: req.user,
        },
    });
});

// Chỉ Admin
router.get("/admin", authenticateToken, authorizeRoles("Admin"), (req, res) => {
    res.json({
        success: true,
        message: "Bạn có quyền Admin",
        user: req.user,
    });
});

// Chỉ Giảng viên
router.get(
    "/teacher",
    authenticateToken,
    authorizeRoles("Teacher"),
    (req, res) => {
        res.json({
            success: true,
            message: "Bạn có quyền Giảng viên",
            user: req.user,
        });
    },
);

// Chỉ Sinh viên
router.get(
    "/student",
    authenticateToken,
    authorizeRoles("Student"),
    (req, res) => {
        res.json({
            success: true,
            message: "Bạn có quyền Sinh viên",
            user: req.user,
        });
    },
);

module.exports = router;
