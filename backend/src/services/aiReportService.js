const fs = require("fs");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

async function analyzeReportWithAI(file) {
    if (!file) {
        throw new Error("Không có file báo cáo");
    }

    const fileBuffer = fs.readFileSync(file.path);

    const formData = new FormData();

    const blob = new Blob([fileBuffer], {
        type: file.mimetype,
    });

    formData.append("file", blob, file.originalname);

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/analyze-report`, {
        method: "POST",
        body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.detail || "AI Service xử lý thất bại");
    }

    return result;
}

module.exports = {
    analyzeReportWithAI,
};
