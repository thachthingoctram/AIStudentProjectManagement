const { getPool, sql } = require("../config/db");

// GET /api/teachers
async function getTeachers(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                t.TeacherId,
                t.UserId,
                t.TeacherCode,
                t.Department,
                t.AcademicTitle,
                t.CreatedAt,
                u.Username,
                u.FullName,
                u.Email,
                u.Phone
            FROM Teachers t
            INNER JOIN Users u ON t.UserId = u.UserId
            ORDER BY t.TeacherId DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error("Get teachers error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách giảng viên",
            error: error.message,
        });
    }
}

// GET /api/teachers/:id
async function getTeacherById(req, res) {
    try {
        const { id } = req.params;

        const pool = getPool();

        const result = await pool.request().input("TeacherId", sql.Int, id)
            .query(`
                SELECT
                    t.TeacherId,
                    t.UserId,
                    t.TeacherCode,
                    t.Department,
                    t.AcademicTitle,
                    t.CreatedAt,
                    u.Username,
                    u.FullName,
                    u.Email,
                    u.Phone
                FROM Teachers t
                INNER JOIN Users u ON t.UserId = u.UserId
                WHERE t.TeacherId = @TeacherId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy giảng viên",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Get teacher error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin giảng viên",
            error: error.message,
        });
    }
}

// POST /api/teachers
async function createTeacher(req, res) {
    try {
        const { userId, teacherCode, department, academicTitle } = req.body;

        if (!userId || !teacherCode) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập UserId và mã giảng viên",
            });
        }

        const pool = getPool();

        // Kiểm tra User
        const userCheck = await pool.request().input("UserId", sql.Int, userId)
            .query(`
                SELECT UserId, Role
                FROM Users
                WHERE UserId = @UserId
            `);

        if (userCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User không tồn tại",
            });
        }

        if (userCheck.recordset[0].Role !== "Teacher") {
            return res.status(400).json({
                success: false,
                message: "User này không có role Teacher",
            });
        }

        // Kiểm tra User đã có hồ sơ Teacher
        const teacherUserCheck = await pool
            .request()
            .input("UserId", sql.Int, userId).query(`
                SELECT TeacherId
                FROM Teachers
                WHERE UserId = @UserId
            `);

        if (teacherUserCheck.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "User này đã có hồ sơ giảng viên",
            });
        }

        // Kiểm tra mã giảng viên
        const codeCheck = await pool
            .request()
            .input("TeacherCode", sql.VarChar(50), teacherCode).query(`
                SELECT TeacherId
                FROM Teachers
                WHERE TeacherCode = @TeacherCode
            `);

        if (codeCheck.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Mã giảng viên đã tồn tại",
            });
        }

        const result = await pool
            .request()
            .input("UserId", sql.Int, userId)
            .input("TeacherCode", sql.VarChar(50), teacherCode)
            .input("Department", sql.NVarChar(100), department || null)
            .input("AcademicTitle", sql.NVarChar(100), academicTitle || null)
            .query(`
                INSERT INTO Teachers
                (
                    UserId,
                    TeacherCode,
                    Department,
                    AcademicTitle
                )
                OUTPUT INSERTED.TeacherId
                VALUES
                (
                    @UserId,
                    @TeacherCode,
                    @Department,
                    @AcademicTitle
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo hồ sơ giảng viên thành công",
            data: {
                teacherId: result.recordset[0].TeacherId,
            },
        });
    } catch (error) {
        console.error("Create teacher error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể tạo hồ sơ giảng viên",
            error: error.message,
        });
    }
}

// PUT /api/teachers/:id
async function updateTeacher(req, res) {
    try {
        const { id } = req.params;

        const { teacherCode, department, academicTitle } = req.body;

        const pool = getPool();

        // Kiểm tra mã giảng viên trùng
        if (teacherCode) {
            const codeCheck = await pool
                .request()
                .input("TeacherCode", sql.VarChar(50), teacherCode)
                .input("TeacherId", sql.Int, id).query(`
                    SELECT TeacherId
                    FROM Teachers
                    WHERE TeacherCode = @TeacherCode
                      AND TeacherId <> @TeacherId
                `);

            if (codeCheck.recordset.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Mã giảng viên đã tồn tại",
                });
            }
        }

        const result = await pool
            .request()
            .input("TeacherId", sql.Int, id)
            .input("TeacherCode", sql.VarChar(50), teacherCode)
            .input("Department", sql.NVarChar(100), department || null)
            .input("AcademicTitle", sql.NVarChar(100), academicTitle || null)
            .query(`
                UPDATE Teachers
                SET
                    TeacherCode = @TeacherCode,
                    Department = @Department,
                    AcademicTitle = @AcademicTitle
                WHERE TeacherId = @TeacherId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy giảng viên",
            });
        }

        res.json({
            success: true,
            message: "Cập nhật giảng viên thành công",
        });
    } catch (error) {
        console.error("Update teacher error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể cập nhật giảng viên",
            error: error.message,
        });
    }
}

// DELETE /api/teachers/:id
async function deleteTeacher(req, res) {
    try {
        const { id } = req.params;

        const pool = getPool();

        const result = await pool.request().input("TeacherId", sql.Int, id)
            .query(`
                DELETE FROM Teachers
                WHERE TeacherId = @TeacherId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy giảng viên",
            });
        }

        res.json({
            success: true,
            message: "Xóa giảng viên thành công",
        });
    } catch (error) {
        console.error("Delete teacher error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể xóa giảng viên",
            error: error.message,
        });
    }
}

module.exports = {
    getTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
};
