const express = require("express");

const {
    getGrades,
    getGradeById,
    createGrade,
    updateGrade,
    deleteGrade,
} = require("../controllers/gradeController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

router.get("/", getGrades);
router.get("/:id", getGradeById);
router.post("/", createGrade);
router.put("/:id", updateGrade);
router.delete("/:id", deleteGrade);

module.exports = router;
