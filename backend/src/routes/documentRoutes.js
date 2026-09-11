const express = require("express");

const {
    getDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
} = require("../controllers/documentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Xác thực người dùng
router.use(authenticateToken);

// Chỉ Admin được quản lý Documents
router.use(authorizeRoles("Admin"));

router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.post("/", createDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
