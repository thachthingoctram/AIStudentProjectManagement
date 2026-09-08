const { sql, getPool } = require("../config/db");

// GET /api/groups
async function getGroups(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                g.GroupId,
                g.ClassId,
                c.ClassCode,
                c.ClassName,
                g.GroupName,
                g.GroupCode,
                g.LeaderId,
                s.StudentCode AS LeaderCode,
                u.FullName AS LeaderName,
                g.MaxMembers,
                g.Status,
                g.CreatedAt
            FROM Groups g
            INNER JOIN Classes c
                ON g.ClassId = c.ClassId
            LEFT JOIN Students s
                ON g.LeaderId = s.StudentId
            LEFT JOIN Users u
                ON s.UserId = u.UserId
            ORDER BY g.GroupId DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách nhóm:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// GET /api/groups/:id
async function getGroupById(req, res) {
    try {
        const pool = getPool();
        const groupId = parseInt(req.params.id);

        if (isNaN(groupId)) {
            return res.status(400).json({
                success: false,
                message: "GroupId không hợp lệ",
            });
        }

        const result = await pool.request().input("GroupId", sql.Int, groupId)
            .query(`
                SELECT
                    g.GroupId,
                    g.ClassId,
                    c.ClassCode,
                    c.ClassName,
                    g.GroupName,
                    g.GroupCode,
                    g.LeaderId,
                    s.StudentCode AS LeaderCode,
                    u.FullName AS LeaderName,
                    g.MaxMembers,
                    g.Status,
                    g.CreatedAt
                FROM Groups g
                INNER JOIN Classes c
                    ON g.ClassId = c.ClassId
                LEFT JOIN Students s
                    ON g.LeaderId = s.StudentId
                LEFT JOIN Users u
                    ON s.UserId = u.UserId
                WHERE g.GroupId = @GroupId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhóm",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi lấy nhóm:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// POST /api/groups
async function createGroup(req, res) {
    try {
        const pool = getPool();

        const { classId, groupName, groupCode, leaderId, maxMembers, status } =
            req.body;

        if (!classId || !groupName || !groupCode || !maxMembers || !status) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
            });
        }

        // Kiểm tra lớp
        const classResult = await pool
            .request()
            .input("ClassId", sql.Int, classId).query(`
                SELECT ClassId
                FROM Classes
                WHERE ClassId = @ClassId
            `);

        if (classResult.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Lớp không tồn tại",
            });
        }

        // Kiểm tra GroupCode trùng
        const duplicateResult = await pool
            .request()
            .input("GroupCode", sql.VarChar(100), groupCode).query(`
                SELECT GroupId
                FROM Groups
                WHERE GroupCode = @GroupCode
            `);

        if (duplicateResult.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: "GroupCode đã tồn tại",
            });
        }

        // Nếu có LeaderId thì kiểm tra sinh viên
        if (leaderId) {
            const studentResult = await pool
                .request()
                .input("LeaderId", sql.Int, leaderId).query(`
                    SELECT StudentId
                    FROM Students
                    WHERE StudentId = @LeaderId
                `);

            if (studentResult.recordset.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Sinh viên trưởng nhóm không tồn tại",
                });
            }
        }

        const result = await pool
            .request()
            .input("ClassId", sql.Int, classId)
            .input("GroupName", sql.NVarChar(255), groupName)
            .input("GroupCode", sql.VarChar(100), groupCode)
            .input("LeaderId", sql.Int, leaderId || null)
            .input("MaxMembers", sql.Int, maxMembers)
            .input("Status", sql.VarChar(50), status).query(`
                INSERT INTO Groups
                (
                    ClassId,
                    GroupName,
                    GroupCode,
                    LeaderId,
                    MaxMembers,
                    Status
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @ClassId,
                    @GroupName,
                    @GroupCode,
                    @LeaderId,
                    @MaxMembers,
                    @Status
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo nhóm thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi tạo nhóm:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// PUT /api/groups/:id
async function updateGroup(req, res) {
    try {
        const pool = getPool();
        const groupId = parseInt(req.params.id);

        if (isNaN(groupId)) {
            return res.status(400).json({
                success: false,
                message: "GroupId không hợp lệ",
            });
        }

        const { classId, groupName, groupCode, leaderId, maxMembers, status } =
            req.body;

        if (!classId || !groupName || !groupCode || !maxMembers || !status) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
            });
        }

        // Kiểm tra nhóm tồn tại
        const groupResult = await pool
            .request()
            .input("GroupId", sql.Int, groupId).query(`
                SELECT GroupId
                FROM Groups
                WHERE GroupId = @GroupId
            `);

        if (groupResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhóm",
            });
        }

        // Kiểm tra GroupCode trùng với nhóm khác
        const duplicateResult = await pool
            .request()
            .input("GroupCode", sql.VarChar(100), groupCode)
            .input("GroupId", sql.Int, groupId).query(`
                SELECT GroupId
                FROM Groups
                WHERE GroupCode = @GroupCode
                  AND GroupId <> @GroupId
            `);

        if (duplicateResult.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: "GroupCode đã tồn tại",
            });
        }

        const result = await pool
            .request()
            .input("GroupId", sql.Int, groupId)
            .input("ClassId", sql.Int, classId)
            .input("GroupName", sql.NVarChar(255), groupName)
            .input("GroupCode", sql.VarChar(100), groupCode)
            .input("LeaderId", sql.Int, leaderId || null)
            .input("MaxMembers", sql.Int, maxMembers)
            .input("Status", sql.VarChar(50), status).query(`
                UPDATE Groups
                SET
                    ClassId = @ClassId,
                    GroupName = @GroupName,
                    GroupCode = @GroupCode,
                    LeaderId = @LeaderId,
                    MaxMembers = @MaxMembers,
                    Status = @Status
                OUTPUT INSERTED.*
                WHERE GroupId = @GroupId
            `);

        res.json({
            success: true,
            message: "Cập nhật nhóm thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi cập nhật nhóm:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// DELETE /api/groups/:id
async function deleteGroup(req, res) {
    try {
        const pool = getPool();
        const groupId = parseInt(req.params.id);

        if (isNaN(groupId)) {
            return res.status(400).json({
                success: false,
                message: "GroupId không hợp lệ",
            });
        }

        const result = await pool.request().input("GroupId", sql.Int, groupId)
            .query(`
                DELETE FROM Groups
                WHERE GroupId = @GroupId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhóm",
            });
        }

        res.json({
            success: true,
            message: "Xóa nhóm thành công",
        });
    } catch (error) {
        console.error("Lỗi xóa nhóm:", error);

        res.status(500).json({
            success: false,
            message: "Không thể xóa nhóm. Có thể nhóm đang được sử dụng.",
        });
    }
}

module.exports = {
    getGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
};
