const express = require("express");

const {
    getGroupMembers,
    getGroupMemberById,
    createGroupMember,
    updateGroupMember,
    deleteGroupMember,
} = require("../controllers/groupMemberController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

router.get("/", getGroupMembers);
router.get("/:id", getGroupMemberById);
router.post("/", createGroupMember);
router.put("/:id", updateGroupMember);
router.delete("/:id", deleteGroupMember);

module.exports = router;
