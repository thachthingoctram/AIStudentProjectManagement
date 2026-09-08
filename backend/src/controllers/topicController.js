const { sql, getPool } = require("../config/db");

// GET /api/topics
async function getTopics(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                t.TopicId,
                t.TeacherId,
                te.TeacherCode,
                u.FullName AS TeacherName,
                t.TopicName,
                t.Description,
                t.Objectives,
                t.Requirements,
                t.Technology,
                t.MaxGroups,
                t.Status,
                t.CreatedAt,
                t.UpdatedAt
            FROM Topics t
            LEFT JOIN Teachers te
                ON t.TeacherId = te.TeacherId
            LEFT JOIN Users u
                ON te.UserId = u.UserId
            ORDER BY t.TopicId DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách đề tài:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// GET /api/topics/:id
async function getTopicById(req, res) {
    try {
        const pool = getPool();
        const topicId = parseInt(req.params.id);

        if (isNaN(topicId)) {
            return res.status(400).json({
                success: false,
                message: "TopicId không hợp lệ",
            });
        }

        const result = await pool.request().input("TopicId", sql.Int, topicId)
            .query(`
                SELECT
                    t.TopicId,
                    t.TeacherId,
                    te.TeacherCode,
                    u.FullName AS TeacherName,
                    t.TopicName,
                    t.Description,
                    t.Objectives,
                    t.Requirements,
                    t.Technology,
                    t.MaxGroups,
                    t.Status,
                    t.CreatedAt,
                    t.UpdatedAt
                FROM Topics t
                LEFT JOIN Teachers te
                    ON t.TeacherId = te.TeacherId
                LEFT JOIN Users u
                    ON te.UserId = u.UserId
                WHERE t.TopicId = @TopicId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đề tài",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi lấy đề tài:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// POST /api/topics
async function createTopic(req, res) {
    try {
        const pool = getPool();

        const {
            teacherId,
            topicName,
            description,
            objectives,
            requirements,
            technology,
            maxGroups,
            status,
        } = req.body;

        if (!topicName || !maxGroups || !status) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
            });
        }

        // Kiểm tra giảng viên nếu có TeacherId
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

        const result = await pool
            .request()
            .input("TeacherId", sql.Int, teacherId || null)
            .input("TopicName", sql.NVarChar(sql.MAX), topicName)
            .input("Description", sql.NVarChar(sql.MAX), description || null)
            .input("Objectives", sql.NVarChar(sql.MAX), objectives || null)
            .input("Requirements", sql.NVarChar(sql.MAX), requirements || null)
            .input("Technology", sql.NVarChar(sql.MAX), technology || null)
            .input("MaxGroups", sql.Int, maxGroups)
            .input("Status", sql.VarChar(50), status).query(`
                INSERT INTO Topics
                (
                    TeacherId,
                    TopicName,
                    Description,
                    Objectives,
                    Requirements,
                    Technology,
                    MaxGroups,
                    Status
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @TeacherId,
                    @TopicName,
                    @Description,
                    @Objectives,
                    @Requirements,
                    @Technology,
                    @MaxGroups,
                    @Status
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo đề tài thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi tạo đề tài:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// PUT /api/topics/:id
async function updateTopic(req, res) {
    try {
        const pool = getPool();
        const topicId = parseInt(req.params.id);

        if (isNaN(topicId)) {
            return res.status(400).json({
                success: false,
                message: "TopicId không hợp lệ",
            });
        }

        const {
            teacherId,
            topicName,
            description,
            objectives,
            requirements,
            technology,
            maxGroups,
            status,
        } = req.body;

        if (!topicName || !maxGroups || !status) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
            });
        }

        // Kiểm tra đề tài
        const topicResult = await pool
            .request()
            .input("TopicId", sql.Int, topicId).query(`
                SELECT TopicId
                FROM Topics
                WHERE TopicId = @TopicId
            `);

        if (topicResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đề tài",
            });
        }

        // Kiểm tra giảng viên nếu có TeacherId
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

        const result = await pool
            .request()
            .input("TopicId", sql.Int, topicId)
            .input("TeacherId", sql.Int, teacherId || null)
            .input("TopicName", sql.NVarChar(sql.MAX), topicName)
            .input("Description", sql.NVarChar(sql.MAX), description || null)
            .input("Objectives", sql.NVarChar(sql.MAX), objectives || null)
            .input("Requirements", sql.NVarChar(sql.MAX), requirements || null)
            .input("Technology", sql.NVarChar(sql.MAX), technology || null)
            .input("MaxGroups", sql.Int, maxGroups)
            .input("Status", sql.VarChar(50), status).query(`
                UPDATE Topics
                SET
                    TeacherId = @TeacherId,
                    TopicName = @TopicName,
                    Description = @Description,
                    Objectives = @Objectives,
                    Requirements = @Requirements,
                    Technology = @Technology,
                    MaxGroups = @MaxGroups,
                    Status = @Status,
                    UpdatedAt = GETDATE()
                OUTPUT INSERTED.*
                WHERE TopicId = @TopicId
            `);

        res.json({
            success: true,
            message: "Cập nhật đề tài thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi cập nhật đề tài:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// DELETE /api/topics/:id
async function deleteTopic(req, res) {
    try {
        const pool = getPool();
        const topicId = parseInt(req.params.id);

        if (isNaN(topicId)) {
            return res.status(400).json({
                success: false,
                message: "TopicId không hợp lệ",
            });
        }

        const result = await pool.request().input("TopicId", sql.Int, topicId)
            .query(`
                DELETE FROM Topics
                WHERE TopicId = @TopicId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đề tài",
            });
        }

        res.json({
            success: true,
            message: "Xóa đề tài thành công",
        });
    } catch (error) {
        console.error("Lỗi xóa đề tài:", error);

        res.status(500).json({
            success: false,
            message: "Không thể xóa đề tài. Có thể đề tài đang được sử dụng.",
        });
    }
}

module.exports = {
    getTopics,
    getTopicById,
    createTopic,
    updateTopic,
    deleteTopic,
};
