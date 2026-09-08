const { sql, getPool } = require("../config/db");

async function getSubmissionRequirements(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                sr.RequirementId,
                sr.ProjectId,
                p.ProjectName,
                sr.Title,
                sr.Description,
                sr.Deadline,
                sr.AllowedFileTypes,
                sr.MaxFileSizeMB,
                sr.IsRequired,
                sr.CreatedAt
            FROM SubmissionRequirements sr
            INNER JOIN Projects p
                ON sr.ProjectId = p.ProjectId
            ORDER BY sr.Deadline ASC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách yêu cầu nộp bài",
        });
    }
}

async function getSubmissionRequirementById(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool.request().input("RequirementId", sql.Int, id)
            .query(`
                SELECT
                    sr.RequirementId,
                    sr.ProjectId,
                    p.ProjectName,
                    sr.Title,
                    sr.Description,
                    sr.Deadline,
                    sr.AllowedFileTypes,
                    sr.MaxFileSizeMB,
                    sr.IsRequired,
                    sr.CreatedAt
                FROM SubmissionRequirements sr
                INNER JOIN Projects p
                    ON sr.ProjectId = p.ProjectId
                WHERE sr.RequirementId = @RequirementId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu nộp bài",
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
            message: "Lỗi khi lấy yêu cầu nộp bài",
        });
    }
}

async function createSubmissionRequirement(req, res) {
    try {
        const pool = getPool();

        const {
            ProjectId,
            Title,
            Description,
            Deadline,
            AllowedFileTypes,
            MaxFileSizeMB,
            IsRequired,
        } = req.body;

        if (!ProjectId || !Title || !Deadline || MaxFileSizeMB === undefined) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
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

        const result = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId)
            .input("Title", sql.NVarChar, Title)
            .input("Description", sql.NVarChar, Description || null)
            .input("Deadline", sql.DateTime, Deadline)
            .input("AllowedFileTypes", sql.VarChar, AllowedFileTypes || null)
            .input("MaxFileSizeMB", sql.Int, MaxFileSizeMB)
            .input(
                "IsRequired",
                sql.Bit,
                IsRequired === undefined ? true : IsRequired,
            ).query(`
                INSERT INTO SubmissionRequirements
                (
                    ProjectId,
                    Title,
                    Description,
                    Deadline,
                    AllowedFileTypes,
                    MaxFileSizeMB,
                    IsRequired
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @ProjectId,
                    @Title,
                    @Description,
                    @Deadline,
                    @AllowedFileTypes,
                    @MaxFileSizeMB,
                    @IsRequired
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo yêu cầu nộp bài thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo yêu cầu nộp bài",
        });
    }
}

async function updateSubmissionRequirement(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const {
            ProjectId,
            Title,
            Description,
            Deadline,
            AllowedFileTypes,
            MaxFileSizeMB,
            IsRequired,
        } = req.body;

        if (!ProjectId || !Title || !Deadline || MaxFileSizeMB === undefined) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
            });
        }

        const requirement = await pool
            .request()
            .input("RequirementId", sql.Int, id).query(`
                SELECT RequirementId
                FROM SubmissionRequirements
                WHERE RequirementId = @RequirementId
            `);

        if (requirement.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu nộp bài",
            });
        }

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

        const result = await pool
            .request()
            .input("RequirementId", sql.Int, id)
            .input("ProjectId", sql.Int, ProjectId)
            .input("Title", sql.NVarChar, Title)
            .input("Description", sql.NVarChar, Description || null)
            .input("Deadline", sql.DateTime, Deadline)
            .input("AllowedFileTypes", sql.VarChar, AllowedFileTypes || null)
            .input("MaxFileSizeMB", sql.Int, MaxFileSizeMB)
            .input(
                "IsRequired",
                sql.Bit,
                IsRequired === undefined ? true : IsRequired,
            ).query(`
                UPDATE SubmissionRequirements
                SET
                    ProjectId = @ProjectId,
                    Title = @Title,
                    Description = @Description,
                    Deadline = @Deadline,
                    AllowedFileTypes = @AllowedFileTypes,
                    MaxFileSizeMB = @MaxFileSizeMB,
                    IsRequired = @IsRequired
                OUTPUT INSERTED.*
                WHERE RequirementId = @RequirementId
            `);

        res.json({
            success: true,
            message: "Cập nhật yêu cầu nộp bài thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật yêu cầu nộp bài",
        });
    }
}

async function deleteSubmissionRequirement(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool.request().input("RequirementId", sql.Int, id)
            .query(`
                DELETE FROM SubmissionRequirements
                OUTPUT DELETED.*
                WHERE RequirementId = @RequirementId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu nộp bài",
            });
        }

        res.json({
            success: true,
            message: "Xóa yêu cầu nộp bài thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa yêu cầu nộp bài",
        });
    }
}

module.exports = {
    getSubmissionRequirements,
    getSubmissionRequirementById,
    createSubmissionRequirement,
    updateSubmissionRequirement,
    deleteSubmissionRequirement,
};
