const { sql, getPool } = require("../config/db");

async function getProgresses(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                pr.ProgressId,
                pr.ProjectId,
                p.ProjectName,
                pr.Title,
                pr.Description,
                pr.ProgressPercent,
                pr.StartDate,
                pr.EndDate,
                pr.Status,
                pr.StudentNote,
                pr.TeacherComment,
                pr.CreatedAt,
                pr.UpdatedAt
            FROM Progress pr
            INNER JOIN Projects p
                ON pr.ProjectId = p.ProjectId
            ORDER BY pr.StartDate ASC, pr.ProgressId ASC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách tiến độ",
        });
    }
}

async function getProgressById(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool.request().input("ProgressId", sql.Int, id)
            .query(`
                SELECT
                    pr.ProgressId,
                    pr.ProjectId,
                    p.ProjectName,
                    pr.Title,
                    pr.Description,
                    pr.ProgressPercent,
                    pr.StartDate,
                    pr.EndDate,
                    pr.Status,
                    pr.StudentNote,
                    pr.TeacherComment,
                    pr.CreatedAt,
                    pr.UpdatedAt
                FROM Progress pr
                INNER JOIN Projects p
                    ON pr.ProjectId = p.ProjectId
                WHERE pr.ProgressId = @ProgressId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tiến độ",
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
            message: "Lỗi khi lấy tiến độ",
        });
    }
}

async function createProgress(req, res) {
    try {
        const pool = getPool();

        const {
            ProjectId,
            Title,
            Description,
            ProgressPercent,
            StartDate,
            EndDate,
            Status,
            StudentNote,
            TeacherComment,
        } = req.body;

        if (!ProjectId || !Title || ProgressPercent === undefined || !Status) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
            });
        }

        if (Number(ProgressPercent) < 0 || Number(ProgressPercent) > 100) {
            return res.status(400).json({
                success: false,
                message: "ProgressPercent phải nằm trong khoảng 0 đến 100",
            });
        }

        if (StartDate && EndDate && new Date(StartDate) > new Date(EndDate)) {
            return res.status(400).json({
                success: false,
                message: "StartDate không được lớn hơn EndDate",
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
            .input("ProgressPercent", sql.Decimal(5, 2), ProgressPercent)
            .input("StartDate", sql.Date, StartDate || null)
            .input("EndDate", sql.Date, EndDate || null)
            .input("Status", sql.VarChar, Status)
            .input("StudentNote", sql.NVarChar, StudentNote || null)
            .input("TeacherComment", sql.NVarChar, TeacherComment || null)
            .query(`
                INSERT INTO Progress
                (
                    ProjectId,
                    Title,
                    Description,
                    ProgressPercent,
                    StartDate,
                    EndDate,
                    Status,
                    StudentNote,
                    TeacherComment
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @ProjectId,
                    @Title,
                    @Description,
                    @ProgressPercent,
                    @StartDate,
                    @EndDate,
                    @Status,
                    @StudentNote,
                    @TeacherComment
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo tiến độ thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo tiến độ",
        });
    }
}

async function updateProgress(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const {
            ProjectId,
            Title,
            Description,
            ProgressPercent,
            StartDate,
            EndDate,
            Status,
            StudentNote,
            TeacherComment,
        } = req.body;

        if (!ProjectId || !Title || ProgressPercent === undefined || !Status) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
            });
        }

        if (Number(ProgressPercent) < 0 || Number(ProgressPercent) > 100) {
            return res.status(400).json({
                success: false,
                message: "ProgressPercent phải nằm trong khoảng 0 đến 100",
            });
        }

        if (StartDate && EndDate && new Date(StartDate) > new Date(EndDate)) {
            return res.status(400).json({
                success: false,
                message: "StartDate không được lớn hơn EndDate",
            });
        }

        // Kiểm tra Progress
        const progress = await pool.request().input("ProgressId", sql.Int, id)
            .query(`
                SELECT ProgressId
                FROM Progress
                WHERE ProgressId = @ProgressId
            `);

        if (progress.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tiến độ",
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
            .input("ProgressId", sql.Int, id)
            .input("ProjectId", sql.Int, ProjectId)
            .input("Title", sql.NVarChar, Title)
            .input("Description", sql.NVarChar, Description || null)
            .input("ProgressPercent", sql.Decimal(5, 2), ProgressPercent)
            .input("StartDate", sql.Date, StartDate || null)
            .input("EndDate", sql.Date, EndDate || null)
            .input("Status", sql.VarChar, Status)
            .input("StudentNote", sql.NVarChar, StudentNote || null)
            .input("TeacherComment", sql.NVarChar, TeacherComment || null)
            .query(`
                UPDATE Progress
                SET
                    ProjectId = @ProjectId,
                    Title = @Title,
                    Description = @Description,
                    ProgressPercent = @ProgressPercent,
                    StartDate = @StartDate,
                    EndDate = @EndDate,
                    Status = @Status,
                    StudentNote = @StudentNote,
                    TeacherComment = @TeacherComment,
                    UpdatedAt = GETDATE()
                OUTPUT INSERTED.*
                WHERE ProgressId = @ProgressId
            `);

        res.json({
            success: true,
            message: "Cập nhật tiến độ thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật tiến độ",
        });
    }
}

async function deleteProgress(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool.request().input("ProgressId", sql.Int, id)
            .query(`
                DELETE FROM Progress
                OUTPUT DELETED.*
                WHERE ProgressId = @ProgressId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tiến độ",
            });
        }

        res.json({
            success: true,
            message: "Xóa tiến độ thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa tiến độ",
        });
    }
}

module.exports = {
    getProgresses,
    getProgressById,
    createProgress,
    updateProgress,
    deleteProgress,
};
