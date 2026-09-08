const { getPool, sql } = require("../config/db");

// GET /api/students
async function getStudents(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                s.StudentId,
                s.UserId,
                s.StudentCode,
                s.DateOfBirth,
                s.Gender,
                s.Major,
                s.AcademicYear,
                s.CreatedAt,
                u.Username,
                u.FullName,
                u.Email,
                u.Phone
            FROM Students s
            INNER JOIN Users u ON s.UserId = u.UserId
            ORDER BY s.StudentId DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error("Get students error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách sinh viên",
            error: error.message,
        });
    }
}

// GET /api/students/:id
async function getStudentById(req, res) {
    try {
        const { id } = req.params;

        const pool = getPool();

        const result = await pool
            .request()
            .input("StudentId", sql.Int, id)
            .query(`
                SELECT
                    s.StudentId,
                    s.UserId,
                    s.StudentCode,
                    s.DateOfBirth,
                    s.Gender,
                    s.Major,
                    s.AcademicYear,
                    s.CreatedAt,
                    u.Username,
                    u.FullName,
                    u.Email,
                    u.Phone
                FROM Students s
                INNER JOIN Users u ON s.UserId = u.UserId
                WHERE s.StudentId = @StudentId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sinh viên",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Get student error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin sinh viên",
            error: error.message,
        });
    }
}

// POST /api/students
async function createStudent(req, res) {
    try {
        const {
            userId,
            studentCode,
            dateOfBirth,
            gender,
            major,
            academicYear,
        } = req.body;

        if (!userId || !studentCode) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập UserId và mã sinh viên",
            });
        }

        const pool = getPool();

        // Kiểm tra UserId tồn tại
        const userCheck = await pool
            .request()
            .input("UserId", sql.Int, userId)
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

        if (userCheck.recordset[0].Role !== "Student") {
            return res.status(400).json({
                success: false,
                message: "User này không có role Student",
            });
        }

        // Kiểm tra UserId đã có hồ sơ sinh viên
        const studentUserCheck = await pool
            .request()
            .input("UserId", sql.Int, userId)
            .query(`
                SELECT StudentId
                FROM Students
                WHERE UserId = @UserId
            `);

        if (studentUserCheck.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "User này đã có hồ sơ sinh viên",
            });
        }

        // Kiểm tra mã sinh viên
        const codeCheck = await pool
            .request()
            .input("StudentCode", sql.VarChar(50), studentCode)
            .query(`
                SELECT StudentId
                FROM Students
                WHERE StudentCode = @StudentCode
            `);

        if (codeCheck.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Mã sinh viên đã tồn tại",
            });
        }

        const result = await pool
            .request()
            .input("UserId", sql.Int, userId)
            .input("StudentCode", sql.VarChar(50), studentCode)
            .input("DateOfBirth", sql.Date, dateOfBirth || null)
            .input("Gender", sql.NVarChar(20), gender || null)
            .input("Major", sql.NVarChar(100), major || null)
            .input("AcademicYear", sql.VarChar(20), academicYear || null)
            .query(`
                INSERT INTO Students
                (
                    UserId,
                    StudentCode,
                    DateOfBirth,
                    Gender,
                    Major,
                    AcademicYear
                )
                OUTPUT INSERTED.StudentId
                VALUES
                (
                    @UserId,
                    @StudentCode,
                    @DateOfBirth,
                    @Gender,
                    @Major,
                    @AcademicYear
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo hồ sơ sinh viên thành công",
            data: {
                studentId: result.recordset[0].StudentId,
            },
        });
    } catch (error) {
        console.error("Create student error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể tạo hồ sơ sinh viên",
            error: error.message,
        });
    }
}

// PUT /api/students/:id
async function updateStudent(req, res) {
    try {
        const { id } = req.params;

        const {
            studentCode,
            dateOfBirth,
            gender,
            major,
            academicYear,
        } = req.body;

        const pool = getPool();

        // Kiểm tra mã sinh viên trùng với người khác
        if (studentCode) {
            const codeCheck = await pool
                .request()
                .input("StudentCode", sql.VarChar(50), studentCode)
                .input("StudentId", sql.Int, id)
                .query(`
                    SELECT StudentId
                    FROM Students
                    WHERE StudentCode = @StudentCode
                      AND StudentId <> @StudentId
                `);

            if (codeCheck.recordset.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Mã sinh viên đã tồn tại",
                });
            }
        }

        const result = await pool
            .request()
            .input("StudentId", sql.Int, id)
            .input("StudentCode", sql.VarChar(50), studentCode)
            .input("DateOfBirth", sql.Date, dateOfBirth || null)
            .input("Gender", sql.NVarChar(20), gender || null)
            .input("Major", sql.NVarChar(100), major || null)
            .input("AcademicYear", sql.VarChar(20), academicYear || null)
            .query(`
                UPDATE Students
                SET
                    StudentCode = @StudentCode,
                    DateOfBirth = @DateOfBirth,
                    Gender = @Gender,
                    Major = @Major,
                    AcademicYear = @AcademicYear
                WHERE StudentId = @StudentId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sinh viên",
            });
        }

        res.json({
            success: true,
            message: "Cập nhật hồ sơ sinh viên thành công",
        });
    } catch (error) {
        console.error("Update student error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể cập nhật sinh viên",
            error: error.message,
        });
    }
}

// DELETE /api/students/:id
async function deleteStudent(req, res) {
    try {
        const { id } = req.params;

        const pool = getPool();

        const result = await pool
            .request()
            .input("StudentId", sql.Int, id)
            .query(`
                DELETE FROM Students
                WHERE StudentId = @StudentId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sinh viên",
            });
        }

        res.json({
            success: true,
            message: "Xóa sinh viên thành công",
        });
    } catch (error) {
        console.error("Delete student error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể xóa sinh viên",
            error: error.message,
        });
    }
}

module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
};