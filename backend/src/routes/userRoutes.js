const express = require("express");

const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} = require("../controllers/userController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Tất cả API Users yêu cầu đăng nhập Admin
router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

// Danh sách users
router.get("/", getUsers);

// User theo ID
router.get("/:id", getUserById);

// Tạo user
router.post("/", createUser);

// Cập nhật user
router.put("/:id", updateUser);

// Xóa user
router.delete("/:id", deleteUser);

module.exports = router;
