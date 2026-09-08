const { sql, getPool } = require("../config/db");

// GET /api/projects
async function getProjects(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                p.ProjectId,
                p.GroupId,
                g.GroupName,
                g.GroupCode,
                p.TopicId,
                t.TopicName,
                p.TeacherId,
                te.TeacherCode,
                u.FullName AS TeacherName,
                p.ProjectName,
                p.Description,
                p.StartDate,
                p.EndDate,
                p.Status,
                p.CreatedAt,
                p.UpdatedAt
            FROM Projects p
            INNER JOIN Groups g
                ON p.GroupId = g.GroupId
            LEFT JOIN Topics t
                ON p.TopicId = t.TopicId
            LEFT JOIN Teachers te
                ON p.TeacherId = te.TeacherId
            LEFT JOIN Users u
                ON te.UserId = u.UserId
            ORDER BY p.ProjectId DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách đồ án:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// GET /api/projects/:id
async function getProjectById(req, res) {
    try {
        const pool = getPool();
        const projectId = parseInt(req.params.id);

        if (isNaN(projectId)) {
            return res.status(400).json({
                success: false,
                message: "ProjectId không hợp lệ",
            });
        }

        const result = await pool
            .request()
            .input("ProjectId", sql.Int, projectId).query(`
                SELECT
                    p.ProjectId,
                    p.GroupId,
                    g.GroupName,
                    g.GroupCode,
                    p.TopicId,
                    t.TopicName,
                    p.TeacherId,
                    te.TeacherCode,
                    u.FullName AS TeacherName,
                    p.ProjectName,
                    p.Description,
                    p.StartDate,
                    p.EndDate,
                    p.Status,
                    p.CreatedAt,
                    p.UpdatedAt
                FROM Projects p
                INNER JOIN Groups g
                    ON p.GroupId = g.GroupId
                LEFT JOIN Topics t
                    ON p.TopicId = t.TopicId
                LEFT JOIN Teachers te
                    ON p.TeacherId = te.TeacherId
                LEFT JOIN Users u
                    ON te.UserId = u.UserId
                WHERE p.ProjectId = @ProjectId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đồ án",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi lấy đồ án:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// POST /api/projects
async function createProject(req, res) {
    try {
        const pool = getPool();

        const {
            groupId,
            topicId,
            teacherId,
            projectName,
            description,
            startDate,
            endDate,
            status,
        } = req.body;

        if (!groupId || !projectName || !status) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
            });
        }

        // Kiểm tra Group
        const groupResult = await pool
            .request()
            .input("GroupId", sql.Int, groupId).query(`
                SELECT GroupId
                FROM Groups
                WHERE GroupId = @GroupId
            `);

        if (groupResult.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Nhóm không tồn tại",
            });
        }

        // Kiểm tra Topic nếu có
        if (topicId) {
            const topicResult = await pool
                .request()
                .input("TopicId", sql.Int, topicId).query(`
                    SELECT TopicId
                    FROM Topics
                    WHERE TopicId = @TopicId
                `);

            if (topicResult.recordset.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Đề tài không tồn tại",
                });
            }
        }

        // Kiểm tra Teacher nếu có
        if (teacherId) {
            const teacherResult = await pool
                .request()
                .input("TeacherId", sql.Int, teacherId).query(`
                    SELECT TeacherId
                    FROM Teachers
                    WHERE TeacherId = @TeacherId
                `);

            if (teacherResult.recordset.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Giảng viên không tồn tại",
                });
            }
        }

        // Kiểm tra nhóm đã có đồ án chưa
        const duplicateResult = await pool
            .request()
            .input("GroupId", sql.Int, groupId).query(`
                SELECT ProjectId
                FROM Projects
                WHERE GroupId = @GroupId
            `);

        if (duplicateResult.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Nhóm này đã có đồ án",
            });
        }

        // Kiểm tra ngày
        if (startDate && endDate && startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: "Ngày bắt đầu không được lớn hơn ngày kết thúc",
            });
        }

        const result = await pool
            .request()
            .input("GroupId", sql.Int, groupId)
            .input("TopicId", sql.Int, topicId || null)
            .input("TeacherId", sql.Int, teacherId || null)
            .input("ProjectName", sql.NVarChar(sql.MAX), projectName)
            .input("Description", sql.NVarChar(sql.MAX), description || null)
            .input("StartDate", sql.Date, startDate || null)
            .input("EndDate", sql.Date, endDate || null)
            .input("Status", sql.VarChar(50), status).query(`
                INSERT INTO Projects
                (
                    GroupId,
                    TopicId,
                    TeacherId,
                    ProjectName,
                    Description,
                    StartDate,
                    EndDate,
                    Status
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @GroupId,
                    @TopicId,
                    @TeacherId,
                    @ProjectName,
                    @Description,
                    @StartDate,
                    @EndDate,
                    @Status
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo đồ án thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi tạo đồ án:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// PUT /api/projects/:id
async function updateProject(req, res) {
    try {
        const pool = getPool();
        const projectId = parseInt(req.params.id);

        if (isNaN(projectId)) {
            return res.status(400).json({
                success: false,
                message: "ProjectId không hợp lệ",
            });
        }

        const {
            groupId,
            topicId,
            teacherId,
            projectName,
            description,
            startDate,
            endDate,
            status,
        } = req.body;

        if (!groupId || !projectName || !status) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
            });
        }

        // Kiểm tra Project
        const projectResult = await pool
            .request()
            .input("ProjectId", sql.Int, projectId).query(`
                SELECT ProjectId
                FROM Projects
                WHERE ProjectId = @ProjectId
            `);

        if (projectResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đồ án",
            });
        }

        // Kiểm tra Group
        const groupResult = await pool
            .request()
            .input("GroupId", sql.Int, groupId).query(`
                SELECT GroupId
                FROM Groups
                WHERE GroupId = @GroupId
            `);

        if (groupResult.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Nhóm không tồn tại",
            });
        }

        // Kiểm tra nhóm trùng đồ án
        const duplicateResult = await pool
            .request()
            .input("GroupId", sql.Int, groupId)
            .input("ProjectId", sql.Int, projectId).query(`
                SELECT ProjectId
                FROM Projects
                WHERE GroupId = @GroupId
                  AND ProjectId <> @ProjectId
            `);

        if (duplicateResult.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Nhóm này đã có đồ án khác",
            });
        }

        // Kiểm tra Topic
        if (topicId) {
            const topicResult = await pool
                .request()
                .input("TopicId", sql.Int, topicId).query(`
                    SELECT TopicId
                    FROM Topics
                    WHERE TopicId = @TopicId
                `);

            if (topicResult.recordset.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Đề tài không tồn tại",
                });
            }
        }

        // Kiểm tra Teacher
        if (teacherId) {
            const teacherResult = await pool
                .request()
                .input("TeacherId", sql.Int, teacherId).query(`
                    SELECT TeacherId
                    FROM Teachers
                    WHERE TeacherId = @TeacherId
                `);

            if (teacherResult.recordset.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Giảng viên không tồn tại",
                });
            }
        }

        if (startDate && endDate && startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: "Ngày bắt đầu không được lớn hơn ngày kết thúc",
            });
        }

        const result = await pool
            .request()
            .input("ProjectId", sql.Int, projectId)
            .input("GroupId", sql.Int, groupId)
            .input("TopicId", sql.Int, topicId || null)
            .input("TeacherId", sql.Int, teacherId || null)
            .input("ProjectName", sql.NVarChar(sql.MAX), projectName)
            .input("Description", sql.NVarChar(sql.MAX), description || null)
            .input("StartDate", sql.Date, startDate || null)
            .input("EndDate", sql.Date, endDate || null)
            .input("Status", sql.VarChar(50), status).query(`
                UPDATE Projects
                SET
                    GroupId = @GroupId,
                    TopicId = @TopicId,
                    TeacherId = @TeacherId,
                    ProjectName = @ProjectName,
                    Description = @Description,
                    StartDate = @StartDate,
                    EndDate = @EndDate,
                    Status = @Status,
                    UpdatedAt = GETDATE()
                OUTPUT INSERTED.*
                WHERE ProjectId = @ProjectId
            `);

        res.json({
            success: true,
            message: "Cập nhật đồ án thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi cập nhật đồ án:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// DELETE /api/projects/:id
async function deleteProject(req, res) {
    try {
        const pool = getPool();
        const projectId = parseInt(req.params.id);

        if (isNaN(projectId)) {
            return res.status(400).json({
                success: false,
                message: "ProjectId không hợp lệ",
            });
        }

        const result = await pool
            .request()
            .input("ProjectId", sql.Int, projectId).query(`
                DELETE FROM Projects
                WHERE ProjectId = @ProjectId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đồ án",
            });
        }

        res.json({
            success: true,
            message: "Xóa đồ án thành công",
        });
    } catch (error) {
        console.error("Lỗi xóa đồ án:", error);

        res.status(500).json({
            success: false,
            message: "Không thể xóa đồ án. Có thể đồ án đang được sử dụng.",
        });
    }
}

module.exports = {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
};
