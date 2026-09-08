const { sql, getPool } = require("../config/db");

async function getSubmissions(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                s.SubmissionId,
                s.RequirementId,
                sr.Title AS RequirementTitle,
                s.ProjectId,
                p.ProjectName,
                s.SubmittedBy,
                u.FullName AS SubmittedByName,
                s.SubmissionNote,
                s.SubmittedAt,
                s.Status,
                s.IsLate,
                s.TeacherComment,
                s.CreatedAt
            FROM Submissions s
            INNER JOIN SubmissionRequirements sr
                ON s.RequirementId = sr.RequirementId
            INNER JOIN Projects p
                ON s.ProjectId = p.ProjectId
            LEFT JOIN Users u
                ON s.SubmittedBy = u.UserId
            ORDER BY s.SubmittedAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách bài nộp",
        });
    }
}

async function getSubmissionById(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool
            .request()
            .input("SubmissionId", sql.Int, id)
            .query(`
                SELECT
                    s.SubmissionId,
                    s.RequirementId,
                    sr.Title AS RequirementTitle,
                    s.ProjectId,
                    p.ProjectName,
                    s.SubmittedBy,
                    u.FullName AS SubmittedByName,
                    s.SubmissionNote,
                    s.SubmittedAt,
                    s.Status,
                    s.IsLate,
                    s.TeacherComment,
                    s.CreatedAt
                FROM Submissions s
                INNER JOIN SubmissionRequirements sr
                    ON s.RequirementId = sr.RequirementId
                INNER JOIN Projects p
                    ON s.ProjectId = p.ProjectId
                LEFT JOIN Users u
                    ON s.SubmittedBy = u.UserId
                WHERE s.SubmissionId = @SubmissionId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài nộp",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy bài nộp",
        });
    }
}

async function createSubmission(req, res) {
    try {
        const pool = getPool();

        const {
            RequirementId,
            ProjectId,
            SubmittedBy,
            SubmissionNote,
            SubmittedAt,
            Status,
            IsLate,
            TeacherComment,
        } = req.body;

        if (!RequirementId || !ProjectId || !Status) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
            });
        }

        // Kiểm tra Requirement
        const requirement = await pool
            .request()
            .input("RequirementId", sql.Int, RequirementId)
            .query(`
                SELECT RequirementId, ProjectId, Deadline
                FROM SubmissionRequirements
                WHERE RequirementId = @RequirementId
            `);

        if (requirement.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Yêu cầu nộp bài không tồn tại",
            });
        }

        const requirementData = requirement.recordset[0];

        // Kiểm tra Project
        const project = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId)
            .query(`
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

        // Requirement phải thuộc Project
        if (requirementData.ProjectId !== ProjectId) {
            return res.status(400).json({
                success: false,
                message: "Yêu cầu nộp bài không thuộc Project này",
            });
        }

        // Nếu có SubmittedBy thì kiểm tra User
        if (SubmittedBy) {
            const user = await pool
                .request()
                .input("UserId", sql.Int, SubmittedBy)
                .query(`
                    SELECT UserId
                    FROM Users
                    WHERE UserId = @UserId
                `);

            if (user.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Người nộp không tồn tại",
                });
            }
        }

        const submitTime = SubmittedAt || new Date();

        // Tự xác định nộp trễ
        const isLate =
            IsLate !== undefined
                ? IsLate
                : new Date(submitTime) > new Date(requirementData.Deadline);

        const result = await pool
            .request()
            .input("RequirementId", sql.Int, RequirementId)
            .input("ProjectId", sql.Int, ProjectId)
            .input("SubmittedBy", sql.Int, SubmittedBy || null)
            .input(
                "SubmissionNote",
                sql.NVarChar,
                SubmissionNote || null
            )
            .input("SubmittedAt", sql.DateTime, submitTime)
            .input("Status", sql.VarChar, Status)
            .input("IsLate", sql.Bit, isLate)
            .input(
                "TeacherComment",
                sql.NVarChar,
                TeacherComment || null
            )
            .query(`
                INSERT INTO Submissions
                (
                    RequirementId,
                    ProjectId,
                    SubmittedBy,
                    SubmissionNote,
                    SubmittedAt,
                    Status,
                    IsLate,
                    TeacherComment
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @RequirementId,
                    @ProjectId,
                    @SubmittedBy,
                    @SubmissionNote,
                    @SubmittedAt,
                    @Status,
                    @IsLate,
                    @TeacherComment
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo bài nộp thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo bài nộp",
        });
    }
}

async function updateSubmission(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const {
            RequirementId,
            ProjectId,
            SubmittedBy,
            SubmissionNote,
            SubmittedAt,
            Status,
            IsLate,
            TeacherComment,
        } = req.body;

        if (!RequirementId || !ProjectId || !Status) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
            });
        }

        const existing = await pool
            .request()
            .input("SubmissionId", sql.Int, id)
            .query(`
                SELECT SubmissionId
                FROM Submissions
                WHERE SubmissionId = @SubmissionId
            `);

        if (existing.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài nộp",
            });
        }

        const result = await pool
            .request()
            .input("SubmissionId", sql.Int, id)
            .input("RequirementId", sql.Int, RequirementId)
            .input("ProjectId", sql.Int, ProjectId)
            .input("SubmittedBy", sql.Int, SubmittedBy || null)
            .input(
                "SubmissionNote",
                sql.NVarChar,
                SubmissionNote || null
            )
            .input(
                "SubmittedAt",
                sql.DateTime,
                SubmittedAt || new Date()
            )
            .input("Status", sql.VarChar, Status)
            .input("IsLate", sql.Bit, IsLate || false)
            .input(
                "TeacherComment",
                sql.NVarChar,
                TeacherComment || null
            )
            .query(`
                UPDATE Submissions
                SET
                    RequirementId = @RequirementId,
                    ProjectId = @ProjectId,
                    SubmittedBy = @SubmittedBy,
                    SubmissionNote = @SubmissionNote,
                    SubmittedAt = @SubmittedAt,
                    Status = @Status,
                    IsLate = @IsLate,
                    TeacherComment = @TeacherComment
                OUTPUT INSERTED.*
                WHERE SubmissionId = @SubmissionId
            `);

        res.json({
            success: true,
            message: "Cập nhật bài nộp thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật bài nộp",
        });
    }
}

async function deleteSubmission(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool
            .request()
            .input("SubmissionId", sql.Int, id)
            .query(`
                DELETE FROM Submissions
                OUTPUT DELETED.*
                WHERE SubmissionId = @SubmissionId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài nộp",
            });
        }

        res.json({
            success: true,
            message: "Xóa bài nộp thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa bài nộp",
        });
    }
}

module.exports = {
    getSubmissions,
    getSubmissionById,
    createSubmission,
    updateSubmission,
    deleteSubmission,
};