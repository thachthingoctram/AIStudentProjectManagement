const fs = require("fs");

const { analyzeReportWithAI } = require("../services/aiReportService");

async function analyzeReport(req, res) {
    let filePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn file PDF hoặc DOCX",
            });
        }

        filePath = req.file.path;

        const extension = req.file.originalname.split(".").pop().toLowerCase();

        if (!["pdf", "docx"].includes(extension)) {
            return res.status(400).json({
                success: false,
                message: "Chỉ hỗ trợ file PDF và DOCX",
            });
        }

        const result = await analyzeReportWithAI(req.file);

        return res.status(200).json({
            success: true,
            message: "Backend gọi AI Service thành công",
            data: result.data,
        });
    } catch (error) {
        console.error("Lỗi analyzeReport:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Không thể phân tích báo cáo",
        });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

module.exports = {
    analyzeReport,
};
