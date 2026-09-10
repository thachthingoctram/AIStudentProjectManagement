const { sql, getPool } = require("../config/db");

// =========================
// GET ALL GRADES
// =========================
async function getGrades(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                GradeId,
                ProjectId,
                TeacherId,
                ContentScore,
                ProgressScore,
                ReportScore,
                PresentationScore,
                TotalScore,
                Comment,
                GradedAt
            FROM Grades
            ORDER BY GradeId DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error("Lỗi getGrades:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách điểm",
            error: error.message,
        });
    }
}

// =========================
// GET GRADE BY ID
// =========================
async function getGradeById(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool.request().input("GradeId", sql.Int, id)
            .query(`
                SELECT
                    GradeId,
                    ProjectId,
                    TeacherId,
                    ContentScore,
                    ProgressScore,
                    ReportScore,
                    PresentationScore,
                    TotalScore,
                    Comment,
                    GradedAt
                FROM Grades
                WHERE GradeId = @GradeId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy điểm",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi getGradeById:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy điểm",
            error: error.message,
        });
    }
}

// =========================
// CREATE GRADE
// =========================
async function createGrade(req, res) {
    try {
        const pool = getPool();

        const {
            ProjectId,
            TeacherId,
            ContentScore,
            ProgressScore,
            ReportScore,
            PresentationScore,
            TotalScore,
            Comment,
            GradedAt,
        } = req.body;

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

        // Kiểm tra project đã có điểm chưa
        const existingGrade = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId).query(`
                SELECT GradeId
                FROM Grades
                WHERE ProjectId = @ProjectId
            `);

        if (existingGrade.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Project này đã có bảng điểm",
            });
        }

        // Kiểm tra Teacher
        if (TeacherId) {
            const teacher = await pool
                .request()
                .input("TeacherId", sql.Int, TeacherId).query(`
                    SELECT TeacherId
                    FROM Teachers
                    WHERE TeacherId = @TeacherId
                `);

            if (teacher.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Teacher không tồn tại",
                });
            }
        }

        // Kiểm tra điểm
        const scores = [
            ContentScore,
            ProgressScore,
            ReportScore,
            PresentationScore,
            TotalScore,
        ];

        for (const score of scores) {
            if (
                score !== undefined &&
                score !== null &&
                (Number(score) < 0 || Number(score) > 10)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Điểm phải nằm trong khoảng 0 đến 10",
                });
            }
        }

        const result = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId)
            .input("TeacherId", sql.Int, TeacherId || null)
            .input("ContentScore", sql.Decimal(5, 2), ContentScore ?? null)
            .input("ProgressScore", sql.Decimal(5, 2), ProgressScore ?? null)
            .input("ReportScore", sql.Decimal(5, 2), ReportScore ?? null)
            .input(
                "PresentationScore",
                sql.Decimal(5, 2),
                PresentationScore ?? null,
            )
            .input("TotalScore", sql.Decimal(5, 2), TotalScore ?? null)
            .input("Comment", sql.NVarChar, Comment || null)
            .input("GradedAt", sql.DateTime, GradedAt || new Date()).query(`
                INSERT INTO Grades
                (
                    ProjectId,
                    TeacherId,
                    ContentScore,
                    ProgressScore,
                    ReportScore,
                    PresentationScore,
                    TotalScore,
                    Comment,
                    GradedAt
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @ProjectId,
                    @TeacherId,
                    @ContentScore,
                    @ProgressScore,
                    @ReportScore,
                    @PresentationScore,
                    @TotalScore,
                    @Comment,
                    @GradedAt
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo bảng điểm thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi createGrade:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo bảng điểm",
            error: error.message,
        });
    }
}

// =========================
// UPDATE GRADE
// =========================
async function updateGrade(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const {
            ProjectId,
            TeacherId,
            ContentScore,
            ProgressScore,
            ReportScore,
            PresentationScore,
            TotalScore,
            Comment,
            GradedAt,
        } = req.body;

        if (!ProjectId) {
            return res.status(400).json({
                success: false,
                message: "ProjectId là bắt buộc",
            });
        }

        const grade = await pool.request().input("GradeId", sql.Int, id).query(`
                SELECT GradeId
                FROM Grades
                WHERE GradeId = @GradeId
            `);

        if (grade.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bảng điểm",
            });
        }

        const scores = [
            ContentScore,
            ProgressScore,
            ReportScore,
            PresentationScore,
            TotalScore,
        ];

        for (const score of scores) {
            if (
                score !== undefined &&
                score !== null &&
                (Number(score) < 0 || Number(score) > 10)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Điểm phải nằm trong khoảng 0 đến 10",
                });
            }
        }

        const result = await pool
            .request()
            .input("GradeId", sql.Int, id)
            .input("ProjectId", sql.Int, ProjectId)
            .input("TeacherId", sql.Int, TeacherId || null)
            .input("ContentScore", sql.Decimal(5, 2), ContentScore ?? null)
            .input("ProgressScore", sql.Decimal(5, 2), ProgressScore ?? null)
            .input("ReportScore", sql.Decimal(5, 2), ReportScore ?? null)
            .input(
                "PresentationScore",
                sql.Decimal(5, 2),
                PresentationScore ?? null,
            )
            .input("TotalScore", sql.Decimal(5, 2), TotalScore ?? null)
            .input("Comment", sql.NVarChar, Comment || null)
            .input("GradedAt", sql.DateTime, GradedAt || new Date()).query(`
                UPDATE Grades
                SET
                    ProjectId = @ProjectId,
                    TeacherId = @TeacherId,
                    ContentScore = @ContentScore,
                    ProgressScore = @ProgressScore,
                    ReportScore = @ReportScore,
                    PresentationScore = @PresentationScore,
                    TotalScore = @TotalScore,
                    Comment = @Comment,
                    GradedAt = @GradedAt
                OUTPUT INSERTED.*
                WHERE GradeId = @GradeId
            `);

        res.json({
            success: true,
            message: "Cập nhật điểm thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi updateGrade:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật điểm",
            error: error.message,
        });
    }
}

// =========================
// DELETE GRADE
// =========================
async function deleteGrade(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool.request().input("GradeId", sql.Int, id)
            .query(`
                DELETE FROM Grades
                OUTPUT DELETED.*
                WHERE GradeId = @GradeId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bảng điểm",
            });
        }

        res.json({
            success: true,
            message: "Xóa bảng điểm thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi deleteGrade:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa bảng điểm",
            error: error.message,
        });
    }
}

module.exports = {
    getGrades,
    getGradeById,
    createGrade,
    updateGrade,
    deleteGrade,
};
