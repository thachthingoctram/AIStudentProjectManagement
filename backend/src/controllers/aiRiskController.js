const { sql, getPool } = require("../config/db");

// GET /api/ai-risk
async function getAIRisks(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                RiskId,
                ProjectId,
                ProgressPercent,
                DaysRemaining,
                SubmissionCount,
                LateSubmissionCount,
                LastSubmissionDate,
                RiskScore,
                RiskLevel,
                Reason,
                CreatedAt
            FROM AI_Risk
            ORDER BY RiskId DESC
        `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("Lỗi getAIRisks:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách dự đoán rủi ro",
            error: error.message
        });
    }
}


// GET /api/ai-risk/:id
async function getAIRiskById(req, res) {
    try {
        const riskId = Number(req.params.id);

        if (!Number.isInteger(riskId)) {
            return res.status(400).json({
                success: false,
                message: "RiskId không hợp lệ"
            });
        }

        const pool = getPool();

        const result = await pool
            .request()
            .input("RiskId", sql.Int, riskId)
            .query(`
                SELECT
                    RiskId,
                    ProjectId,
                    ProgressPercent,
                    DaysRemaining,
                    SubmissionCount,
                    LateSubmissionCount,
                    LastSubmissionDate,
                    RiskScore,
                    RiskLevel,
                    Reason,
                    CreatedAt
                FROM AI_Risk
                WHERE RiskId = @RiskId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy kết quả dự đoán rủi ro"
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {
        console.error("Lỗi getAIRiskById:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy kết quả dự đoán rủi ro",
            error: error.message
        });
    }
}


// POST /api/ai-risk
async function createAIRisk(req, res) {
    try {
        const {
            ProjectId,
            ProgressPercent,
            DaysRemaining,
            SubmissionCount,
            LateSubmissionCount,
            LastSubmissionDate,
            RiskScore,
            RiskLevel,
            Reason
        } = req.body;

        if (!ProjectId) {
            return res.status(400).json({
                success: false,
                message: "ProjectId là bắt buộc"
            });
        }

        const pool = getPool();

        // Kiểm tra Project có tồn tại
        const projectCheck = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId)
            .query(`
                SELECT ProjectId
                FROM Projects
                WHERE ProjectId = @ProjectId
            `);

        if (projectCheck.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "ProjectId không tồn tại"
            });
        }

        const result = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId)
            .input(
                "ProgressPercent",
                sql.Decimal(5, 2),
                ProgressPercent ?? null
            )
            .input(
                "DaysRemaining",
                sql.Int,
                DaysRemaining ?? null
            )
            .input(
                "SubmissionCount",
                sql.Int,
                SubmissionCount ?? 0
            )
            .input(
                "LateSubmissionCount",
                sql.Int,
                LateSubmissionCount ?? 0
            )
            .input(
                "LastSubmissionDate",
                sql.DateTime,
                LastSubmissionDate ?? null
            )
            .input(
                "RiskScore",
                sql.Decimal(5, 2),
                RiskScore ?? null
            )
            .input(
                "RiskLevel",
                sql.VarChar(50),
                RiskLevel ?? null
            )
            .input(
                "Reason",
                sql.NVarChar(sql.MAX),
                Reason ?? null
            )
            .query(`
                INSERT INTO AI_Risk (
                    ProjectId,
                    ProgressPercent,
                    DaysRemaining,
                    SubmissionCount,
                    LateSubmissionCount,
                    LastSubmissionDate,
                    RiskScore,
                    RiskLevel,
                    Reason
                )
                OUTPUT INSERTED.*
                VALUES (
                    @ProjectId,
                    @ProgressPercent,
                    @DaysRemaining,
                    @SubmissionCount,
                    @LateSubmissionCount,
                    @LastSubmissionDate,
                    @RiskScore,
                    @RiskLevel,
                    @Reason
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo kết quả dự đoán rủi ro thành công",
            data: result.recordset[0]
        });

    } catch (error) {
        console.error("Lỗi createAIRisk:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo kết quả dự đoán rủi ro",
            error: error.message
        });
    }
}


// PUT /api/ai-risk/:id
async function updateAIRisk(req, res) {
    try {
        const riskId = Number(req.params.id);

        if (!Number.isInteger(riskId)) {
            return res.status(400).json({
                success: false,
                message: "RiskId không hợp lệ"
            });
        }

        const {
            ProjectId,
            ProgressPercent,
            DaysRemaining,
            SubmissionCount,
            LateSubmissionCount,
            LastSubmissionDate,
            RiskScore,
            RiskLevel,
            Reason
        } = req.body;

        if (!ProjectId) {
            return res.status(400).json({
                success: false,
                message: "ProjectId là bắt buộc"
            });
        }

        const pool = getPool();

        const existing = await pool
            .request()
            .input("RiskId", sql.Int, riskId)
            .query(`
                SELECT RiskId
                FROM AI_Risk
                WHERE RiskId = @RiskId
            `);

        if (existing.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy kết quả dự đoán rủi ro"
            });
        }

        const projectCheck = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId)
            .query(`
                SELECT ProjectId
                FROM Projects
                WHERE ProjectId = @ProjectId
            `);

        if (projectCheck.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "ProjectId không tồn tại"
            });
        }

        const result = await pool
            .request()
            .input("RiskId", sql.Int, riskId)
            .input("ProjectId", sql.Int, ProjectId)
            .input(
                "ProgressPercent",
                sql.Decimal(5, 2),
                ProgressPercent ?? null
            )
            .input(
                "DaysRemaining",
                sql.Int,
                DaysRemaining ?? null
            )
            .input(
                "SubmissionCount",
                sql.Int,
                SubmissionCount ?? 0
            )
            .input(
                "LateSubmissionCount",
                sql.Int,
                LateSubmissionCount ?? 0
            )
            .input(
                "LastSubmissionDate",
                sql.DateTime,
                LastSubmissionDate ?? null
            )
            .input(
                "RiskScore",
                sql.Decimal(5, 2),
                RiskScore ?? null
            )
            .input(
                "RiskLevel",
                sql.VarChar(50),
                RiskLevel ?? null
            )
            .input(
                "Reason",
                sql.NVarChar(sql.MAX),
                Reason ?? null
            )
            .query(`
                UPDATE AI_Risk
                SET
                    ProjectId = @ProjectId,
                    ProgressPercent = @ProgressPercent,
                    DaysRemaining = @DaysRemaining,
                    SubmissionCount = @SubmissionCount,
                    LateSubmissionCount = @LateSubmissionCount,
                    LastSubmissionDate = @LastSubmissionDate,
                    RiskScore = @RiskScore,
                    RiskLevel = @RiskLevel,
                    Reason = @Reason
                OUTPUT INSERTED.*
                WHERE RiskId = @RiskId
            `);

        res.json({
            success: true,
            message: "Cập nhật kết quả dự đoán rủi ro thành công",
            data: result.recordset[0]
        });

    } catch (error) {
        console.error("Lỗi updateAIRisk:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật kết quả dự đoán rủi ro",
            error: error.message
        });
    }
}


// DELETE /api/ai-risk/:id
async function deleteAIRisk(req, res) {
    try {
        const riskId = Number(req.params.id);

        if (!Number.isInteger(riskId)) {
            return res.status(400).json({
                success: false,
                message: "RiskId không hợp lệ"
            });
        }

        const pool = getPool();

        const result = await pool
            .request()
            .input("RiskId", sql.Int, riskId)
            .query(`
                DELETE FROM AI_Risk
                OUTPUT DELETED.*
                WHERE RiskId = @RiskId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy kết quả dự đoán rủi ro"
            });
        }

        res.json({
            success: true,
            message: "Xóa kết quả dự đoán rủi ro thành công",
            data: result.recordset[0]
        });

    } catch (error) {
        console.error("Lỗi deleteAIRisk:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa kết quả dự đoán rủi ro",
            error: error.message
        });
    }
}


module.exports = {
    getAIRisks,
    getAIRiskById,
    createAIRisk,
    updateAIRisk,
    deleteAIRisk
};