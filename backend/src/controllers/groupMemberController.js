const { sql, getPool } = require("../config/db");

// GET /api/group-members
async function getGroupMembers(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                gm.GroupMemberId,
                gm.GroupId,
                g.GroupName,
                g.GroupCode,
                gm.StudentId,
                s.StudentCode,
                u.FullName AS StudentName,
                gm.IsLeader,
                gm.JoinedAt
            FROM GroupMembers gm
            INNER JOIN Groups g
                ON gm.GroupId = g.GroupId
            INNER JOIN Students s
                ON gm.StudentId = s.StudentId
            INNER JOIN Users u
                ON s.UserId = u.UserId
            ORDER BY gm.GroupMemberId DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách thành viên:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// GET /api/group-members/:id
async function getGroupMemberById(req, res) {
    try {
        const pool = getPool();
        const groupMemberId = parseInt(req.params.id);

        if (isNaN(groupMemberId)) {
            return res.status(400).json({
                success: false,
                message: "GroupMemberId không hợp lệ",
            });
        }

        const result = await pool
            .request()
            .input("GroupMemberId", sql.Int, groupMemberId).query(`
                SELECT
                    gm.GroupMemberId,
                    gm.GroupId,
                    g.GroupName,
                    g.GroupCode,
                    gm.StudentId,
                    s.StudentCode,
                    u.FullName AS StudentName,
                    gm.IsLeader,
                    gm.JoinedAt
                FROM GroupMembers gm
                INNER JOIN Groups g
                    ON gm.GroupId = g.GroupId
                INNER JOIN Students s
                    ON gm.StudentId = s.StudentId
                INNER JOIN Users u
                    ON s.UserId = u.UserId
                WHERE gm.GroupMemberId = @GroupMemberId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thành viên",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi lấy thành viên:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// POST /api/group-members
async function createGroupMember(req, res) {
    try {
        const pool = getPool();

        const { groupId, studentId, isLeader } = req.body;

        if (!groupId || !studentId || isLeader === undefined) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin",
            });
        }

        // Kiểm tra nhóm
        const groupResult = await pool
            .request()
            .input("GroupId", sql.Int, groupId).query(`
                SELECT
                    GroupId,
                    MaxMembers
                FROM Groups
                WHERE GroupId = @GroupId
            `);

        if (groupResult.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Nhóm không tồn tại",
            });
        }

        const group = groupResult.recordset[0];

        // Kiểm tra sinh viên
        const studentResult = await pool
            .request()
            .input("StudentId", sql.Int, studentId).query(`
                SELECT StudentId
                FROM Students
                WHERE StudentId = @StudentId
            `);

        if (studentResult.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Sinh viên không tồn tại",
            });
        }

        // Kiểm tra sinh viên đã có trong nhóm
        const duplicateResult = await pool
            .request()
            .input("GroupId", sql.Int, groupId)
            .input("StudentId", sql.Int, studentId).query(`
                SELECT GroupMemberId
                FROM GroupMembers
                WHERE GroupId = @GroupId
                  AND StudentId = @StudentId
            `);

        if (duplicateResult.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Sinh viên đã có trong nhóm",
            });
        }

        // Kiểm tra số lượng thành viên
        const countResult = await pool
            .request()
            .input("GroupId", sql.Int, groupId).query(`
                SELECT COUNT(*) AS TotalMembers
                FROM GroupMembers
                WHERE GroupId = @GroupId
            `);

        const totalMembers = countResult.recordset[0].TotalMembers;

        if (totalMembers >= group.MaxMembers) {
            return res.status(400).json({
                success: false,
                message: "Nhóm đã đủ số lượng thành viên",
            });
        }

        // Nếu là trưởng nhóm thì bỏ quyền trưởng nhóm của người cũ
        if (isLeader === true) {
            await pool.request().input("GroupId", sql.Int, groupId).query(`
                    UPDATE GroupMembers
                    SET IsLeader = 0
                    WHERE GroupId = @GroupId
                `);
        }

        const result = await pool
            .request()
            .input("GroupId", sql.Int, groupId)
            .input("StudentId", sql.Int, studentId)
            .input("IsLeader", sql.Bit, isLeader).query(`
                INSERT INTO GroupMembers
                (
                    GroupId,
                    StudentId,
                    IsLeader
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @GroupId,
                    @StudentId,
                    @IsLeader
                )
            `);

        res.status(201).json({
            success: true,
            message: "Thêm thành viên vào nhóm thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi thêm thành viên:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// PUT /api/group-members/:id
async function updateGroupMember(req, res) {
    try {
        const pool = getPool();
        const groupMemberId = parseInt(req.params.id);

        if (isNaN(groupMemberId)) {
            return res.status(400).json({
                success: false,
                message: "GroupMemberId không hợp lệ",
            });
        }

        const { isLeader } = req.body;

        if (isLeader === undefined) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập IsLeader",
            });
        }

        // Kiểm tra thành viên
        const memberResult = await pool
            .request()
            .input("GroupMemberId", sql.Int, groupMemberId).query(`
                SELECT
                    GroupMemberId,
                    GroupId
                FROM GroupMembers
                WHERE GroupMemberId = @GroupMemberId
            `);

        if (memberResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thành viên",
            });
        }

        const groupId = memberResult.recordset[0].GroupId;

        // Nếu chuyển thành trưởng nhóm
        if (isLeader === true) {
            await pool.request().input("GroupId", sql.Int, groupId).query(`
                    UPDATE GroupMembers
                    SET IsLeader = 0
                    WHERE GroupId = @GroupId
                `);
        }

        const result = await pool
            .request()
            .input("GroupMemberId", sql.Int, groupMemberId)
            .input("IsLeader", sql.Bit, isLeader).query(`
                UPDATE GroupMembers
                SET IsLeader = @IsLeader
                OUTPUT INSERTED.*
                WHERE GroupMemberId = @GroupMemberId
            `);

        res.json({
            success: true,
            message: "Cập nhật thành viên thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi cập nhật thành viên:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
}

// DELETE /api/group-members/:id
async function deleteGroupMember(req, res) {
    try {
        const pool = getPool();
        const groupMemberId = parseInt(req.params.id);

        if (isNaN(groupMemberId)) {
            return res.status(400).json({
                success: false,
                message: "GroupMemberId không hợp lệ",
            });
        }

        const result = await pool
            .request()
            .input("GroupMemberId", sql.Int, groupMemberId).query(`
                DELETE FROM GroupMembers
                WHERE GroupMemberId = @GroupMemberId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thành viên",
            });
        }

        res.json({
            success: true,
            message: "Xóa thành viên khỏi nhóm thành công",
        });
    } catch (error) {
        console.error("Lỗi xóa thành viên:", error);

        res.status(500).json({
            success: false,
            message: "Không thể xóa thành viên",
        });
    }
}

module.exports = {
    getGroupMembers,
    getGroupMemberById,
    createGroupMember,
    updateGroupMember,
    deleteGroupMember,
};
