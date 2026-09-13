const express = require("express");
const multer = require("multer");

const {
    analyzeReport
} = require("../controllers/aiReportController");

const router = express.Router();

const upload = multer({
    dest: "uploads/"
});

router.post(
    "/analyze-report",
    upload.single("file"),
    analyzeReport
);

module.exports = router;