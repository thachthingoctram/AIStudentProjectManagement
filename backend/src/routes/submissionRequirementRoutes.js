const express = require("express");

const {
    getSubmissionRequirements,
    getSubmissionRequirementById,
    createSubmissionRequirement,
    updateSubmissionRequirement,
    deleteSubmissionRequirement,
} = require("../controllers/submissionRequirementController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

router.get("/", getSubmissionRequirements);
router.get("/:id", getSubmissionRequirementById);
router.post("/", createSubmissionRequirement);
router.put("/:id", updateSubmissionRequirement);
router.delete("/:id", deleteSubmissionRequirement);

module.exports = router;
