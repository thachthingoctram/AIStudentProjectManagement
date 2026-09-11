const { sql, getPool } = require("../config/db");

// =====================================================
// GET ALL AI ANALYSIS
// GET /api/ai-analysis
// =====================================================
async function getAIAnalyses(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                AnalysisId,
                ProjectId,
                DocumentId,
                Summary,
                Technologies,
                Strengths,
                Weaknesses,
                MissingSections,
                Recommendations,
                AISuggestedScore,
                Confidence,
                CreatedAt
            FROM AI_Analysis
            ORDER BY AnalysisId DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error("Lỗi getAIAnalyses:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách phân tích AI",
            error: error.message,
        });
    }
}

// =====================================================
// GET AI ANALYSIS BY ID
// GET /api/ai-analysis/:id
// =====================================================
async function getAIAnalysisById(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool.request().input("AnalysisId", sql.Int, id)
            .query(`
                SELECT
                    AnalysisId,
                    ProjectId,
                    DocumentId,
                    Summary,
                    Technologies,
                    Strengths,
                    Weaknesses,
                    MissingSections,
                    Recommendations,
                    AISuggestedScore,
                    Confidence,
                    CreatedAt
                FROM AI_Analysis
                WHERE AnalysisId = @AnalysisId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy kết quả phân tích AI",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi getAIAnalysisById:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy kết quả phân tích AI",
            error: error.message,
        });
    }
}

// =====================================================
// CREATE AI ANALYSIS
// POST /api/ai-analysis
// =====================================================
async function createAIAnalysis(req, res) {
    try {
        const pool = getPool();

        const {
            ProjectId,
            DocumentId,
            Summary,
            Technologies,
            Strengths,
            Weaknesses,
            MissingSections,
            Recommendations,
            AISuggestedScore,
            Confidence,
        } = req.body;

        // ProjectId bắt buộc
        if (!ProjectId) {
            return res.status(400).json({
                success: false,
                message: "ProjectId là bắt buộc",
            });
        }

        // Kiểm tra Project
        const project = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId).query(`
                SELECT ProjectId
                FROM Projects
                WHERE ProjectId = @ProjectId
            `);

        if (project.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project không tồn tại",
            });
        }

        // DocumentId là tùy chọn
        if (DocumentId) {
            const document = await pool
                .request()
                .input("DocumentId", sql.Int, DocumentId).query(`
                    SELECT
                        DocumentId,
                        ProjectId
                    FROM Documents
                    WHERE DocumentId = @DocumentId
                `);

            if (document.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Document không tồn tại",
                });
            }

            // Document phải thuộc Project
            if (document.recordset[0].ProjectId !== Number(ProjectId)) {
                return res.status(400).json({
                    success: false,
                    message: "Document không thuộc Project này",
                });
            }
        }

        const result = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId)
            .input("DocumentId", sql.Int, DocumentId || null)
            .input("Summary", sql.NVarChar, Summary || null)
            .input("Technologies", sql.NVarChar, Technologies || null)
            .input("Strengths", sql.NVarChar, Strengths || null)
            .input("Weaknesses", sql.NVarChar, Weaknesses || null)
            .input("MissingSections", sql.NVarChar, MissingSections || null)
            .input("Recommendations", sql.NVarChar, Recommendations || null)
            .input(
                "AISuggestedScore",
                sql.Decimal(5, 2),
                AISuggestedScore ?? null,
            )
            .input("Confidence", sql.Decimal(5, 2), Confidence ?? null).query(`
                INSERT INTO AI_Analysis
                (
                    ProjectId,
                    DocumentId,
                    Summary,
                    Technologies,
                    Strengths,
                    Weaknesses,
                    MissingSections,
                    Recommendations,
                    AISuggestedScore,
                    Confidence
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @ProjectId,
                    @DocumentId,
                    @Summary,
                    @Technologies,
                    @Strengths,
                    @Weaknesses,
                    @MissingSections,
                    @Recommendations,
                    @AISuggestedScore,
                    @Confidence
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo kết quả phân tích AI thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi createAIAnalysis:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo kết quả phân tích AI",
            error: error.message,
        });
    }
}

// =====================================================
// UPDATE AI ANALYSIS
// PUT /api/ai-analysis/:id
// =====================================================
async function updateAIAnalysis(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const {
            ProjectId,
            DocumentId,
            Summary,
            Technologies,
            Strengths,
            Weaknesses,
            MissingSections,
            Recommendations,
            AISuggestedScore,
            Confidence,
        } = req.body;

        if (!ProjectId) {
            return res.status(400).json({
                success: false,
                message: "ProjectId là bắt buộc",
            });
        }

        // Kiểm tra Analysis
        const analysis = await pool.request().input("AnalysisId", sql.Int, id)
            .query(`
                SELECT AnalysisId
                FROM AI_Analysis
                WHERE AnalysisId = @AnalysisId
            `);

        if (analysis.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy kết quả phân tích AI",
            });
        }

        // Kiểm tra Project
        const project = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId).query(`
                SELECT ProjectId
                FROM Projects
                WHERE ProjectId = @ProjectId
            `);

        if (project.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project không tồn tại",
            });
        }

        // Kiểm tra Document nếu có
        if (DocumentId) {
            const document = await pool
                .request()
                .input("DocumentId", sql.Int, DocumentId).query(`
                    SELECT
                        DocumentId,
                        ProjectId
                    FROM Documents
                    WHERE DocumentId = @DocumentId
                `);

            if (document.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Document không tồn tại",
                });
            }

            if (document.recordset[0].ProjectId !== Number(ProjectId)) {
                return res.status(400).json({
                    success: false,
                    message: "Document không thuộc Project này",
                });
            }
        }

        const result = await pool
            .request()
            .input("AnalysisId", sql.Int, id)
            .input("ProjectId", sql.Int, ProjectId)
            .input("DocumentId", sql.Int, DocumentId || null)
            .input("Summary", sql.NVarChar, Summary || null)
            .input("Technologies", sql.NVarChar, Technologies || null)
            .input("Strengths", sql.NVarChar, Strengths || null)
            .input("Weaknesses", sql.NVarChar, Weaknesses || null)
            .input("MissingSections", sql.NVarChar, MissingSections || null)
            .input("Recommendations", sql.NVarChar, Recommendations || null)
            .input(
                "AISuggestedScore",
                sql.Decimal(5, 2),
                AISuggestedScore ?? null,
            )
            .input("Confidence", sql.Decimal(5, 2), Confidence ?? null).query(`
                UPDATE AI_Analysis
                SET
                    ProjectId = @ProjectId,
                    DocumentId = @DocumentId,
                    Summary = @Summary,
                    Technologies = @Technologies,
                    Strengths = @Strengths,
                    Weaknesses = @Weaknesses,
                    MissingSections = @MissingSections,
                    Recommendations = @Recommendations,
                    AISuggestedScore = @AISuggestedScore,
                    Confidence = @Confidence
                OUTPUT INSERTED.*
                WHERE AnalysisId = @AnalysisId
            `);

        res.json({
            success: true,
            message: "Cập nhật phân tích AI thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi updateAIAnalysis:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật phân tích AI",
            error: error.message,
        });
    }
}

// =====================================================
// DELETE AI ANALYSIS
// DELETE /api/ai-analysis/:id
// =====================================================
async function deleteAIAnalysis(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool.request().input("AnalysisId", sql.Int, id)
            .query(`
                DELETE FROM AI_Analysis
                OUTPUT DELETED.*
                WHERE AnalysisId = @AnalysisId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy kết quả phân tích AI",
            });
        }

        res.json({
            success: true,
            message: "Xóa kết quả phân tích AI thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi deleteAIAnalysis:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa kết quả phân tích AI",
            error: error.message,
        });
    }
}

// =====================================================
// EXPORT
// =====================================================
module.exports = {
    getAIAnalyses,
    getAIAnalysisById,
    createAIAnalysis,
    updateAIAnalysis,
    deleteAIAnalysis,
};
