const express = require("express");

const {
    getGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
} = require("../controllers/groupController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

router.get("/", getGroups);
router.get("/:id", getGroupById);
router.post("/", createGroup);
router.put("/:id", updateGroup);
router.delete("/:id", deleteGroup);

module.exports = router;
