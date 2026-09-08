const { getPool, sql } = require("../config/db");

// GET /api/classes
async function getClasses(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                c.ClassId,
                c.ClassCode,
                c.ClassName,
                c.Major,
                c.AcademicYear,
                c.TeacherId,
                c.Description,
                c.CreatedAt,
                t.TeacherCode,
                u.FullName AS TeacherName
            FROM Classes c
            LEFT JOIN Teachers t
                ON c.TeacherId = t.TeacherId
            LEFT JOIN Users u
                ON t.UserId = u.UserId
            ORDER BY c.ClassId DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error("Get classes error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách lớp học",
            error: error.message,
        });
    }
}

// GET /api/classes/:id
async function getClassById(req, res) {
    try {
        const { id } = req.params;

        const pool = getPool();

        const result = await pool.request().input("ClassId", sql.Int, id)
            .query(`
                SELECT
                    c.ClassId,
                    c.ClassCode,
                    c.ClassName,
                    c.Major,
                    c.AcademicYear,
                    c.TeacherId,
                    c.Description,
                    c.CreatedAt,
                    t.TeacherCode,
                    u.FullName AS TeacherName
                FROM Classes c
                LEFT JOIN Teachers t
                    ON c.TeacherId = t.TeacherId
                LEFT JOIN Users u
                    ON t.UserId = u.UserId
                WHERE c.ClassId = @ClassId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Get class error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin lớp học",
            error: error.message,
        });
    }
}

// POST /api/classes
async function createClass(req, res) {
    try {
        const {
            classCode,
            className,
            major,
            academicYear,
            teacherId,
            description,
        } = req.body;

        if (!classCode || !className) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập mã lớp và tên lớp",
            });
        }

        const pool = getPool();

        // Kiểm tra mã lớp
        const codeCheck = await pool
            .request()
            .input("ClassCode", sql.VarChar(50), classCode).query(`
                SELECT ClassId
                FROM Classes
                WHERE ClassCode = @ClassCode
            `);

        if (codeCheck.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Mã lớp đã tồn tại",
            });
        }

        // Nếu có TeacherId thì kiểm tra giảng viên
        if (teacherId !== undefined && teacherId !== null) {
            const teacherCheck = await pool
                .request()
                .input("TeacherId", sql.Int, teacherId).query(`
                    SELECT TeacherId
                    FROM Teachers
                    WHERE TeacherId = @TeacherId
                `);

            if (teacherCheck.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy giảng viên",
                });
            }
        }

        const result = await pool
            .request()
            .input("ClassCode", sql.VarChar(50), classCode)
            .input("ClassName", sql.NVarChar(100), className)
            .input("Major", sql.NVarChar(100), major || null)
            .input("AcademicYear", sql.VarChar(20), academicYear || null)
            .input("TeacherId", sql.Int, teacherId || null)
            .input("Description", sql.NVarChar(500), description || null)
            .query(`
                INSERT INTO Classes
                (
                    ClassCode,
                    ClassName,
                    Major,
                    AcademicYear,
                    TeacherId,
                    Description
                )
                OUTPUT INSERTED.ClassId
                VALUES
                (
                    @ClassCode,
                    @ClassName,
                    @Major,
                    @AcademicYear,
                    @TeacherId,
                    @Description
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo lớp học thành công",
            data: {
                classId: result.recordset[0].ClassId,
            },
        });
    } catch (error) {
        console.error("Create class error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể tạo lớp học",
            error: error.message,
        });
    }
}

// PUT /api/classes/:id
async function updateClass(req, res) {
    try {
        const { id } = req.params;

        const {
            classCode,
            className,
            major,
            academicYear,
            teacherId,
            description,
        } = req.body;

        if (!classCode || !className) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập mã lớp và tên lớp",
            });
        }

        const pool = getPool();

        // Kiểm tra mã lớp trùng
        const codeCheck = await pool
            .request()
            .input("ClassCode", sql.VarChar(50), classCode)
            .input("ClassId", sql.Int, id).query(`
                SELECT ClassId
                FROM Classes
                WHERE ClassCode = @ClassCode
                  AND ClassId <> @ClassId
            `);

        if (codeCheck.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Mã lớp đã tồn tại",
            });
        }

        // Kiểm tra giảng viên nếu có
        if (teacherId !== undefined && teacherId !== null) {
            const teacherCheck = await pool
                .request()
                .input("TeacherId", sql.Int, teacherId).query(`
                    SELECT TeacherId
                    FROM Teachers
                    WHERE TeacherId = @TeacherId
                `);

            if (teacherCheck.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy giảng viên",
                });
            }
        }

        const result = await pool
            .request()
            .input("ClassId", sql.Int, id)
            .input("ClassCode", sql.VarChar(50), classCode)
            .input("ClassName", sql.NVarChar(100), className)
            .input("Major", sql.NVarChar(100), major || null)
            .input("AcademicYear", sql.VarChar(20), academicYear || null)
            .input("TeacherId", sql.Int, teacherId || null)
            .input("Description", sql.NVarChar(500), description || null)
            .query(`
                UPDATE Classes
                SET
                    ClassCode = @ClassCode,
                    ClassName = @ClassName,
                    Major = @Major,
                    AcademicYear = @AcademicYear,
                    TeacherId = @TeacherId,
                    Description = @Description
                WHERE ClassId = @ClassId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học",
            });
        }

        res.json({
            success: true,
            message: "Cập nhật lớp học thành công",
        });
    } catch (error) {
        console.error("Update class error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể cập nhật lớp học",
            error: error.message,
        });
    }
}

// DELETE /api/classes/:id
async function deleteClass(req, res) {
    try {
        const { id } = req.params;

        const pool = getPool();

        const result = await pool.request().input("ClassId", sql.Int, id)
            .query(`
                DELETE FROM Classes
                WHERE ClassId = @ClassId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học",
            });
        }

        res.json({
            success: true,
            message: "Xóa lớp học thành công",
        });
    } catch (error) {
        console.error("Delete class error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể xóa lớp học",
            error: error.message,
        });
    }
}

module.exports = {
    getClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
};
