const express = require("express");

const {
    getSubmissions,
    getSubmissionById,
    createSubmission,
    updateSubmission,
    deleteSubmission,
} = require("../controllers/submissionController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

router.get("/", getSubmissions);
router.get("/:id", getSubmissionById);
router.post("/", createSubmission);
router.put("/:id", updateSubmission);
router.delete("/:id", deleteSubmission);

module.exports = router;
