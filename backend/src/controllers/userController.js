const bcrypt = require("bcryptjs");
const { getPool, sql } = require("../config/db");

// GET /api/users
async function getUsers(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                UserId,
                Username,
                FullName,
                Email,
                Phone,
                Role,
                IsActive
            FROM Users
            ORDER BY UserId DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error("Get users error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách người dùng",
            error: error.message,
        });
    }
}

// GET /api/users/:id
async function getUserById(req, res) {
    try {
        const { id } = req.params;

        const pool = getPool();

        const result = await pool.request().input("UserId", sql.Int, id).query(`
                SELECT
                    UserId,
                    Username,
                    FullName,
                    Email,
                    Phone,
                    Role,
                    IsActive
                FROM Users
                WHERE UserId = @UserId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Get user error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin người dùng",
            error: error.message,
        });
    }
}

// POST /api/users
async function createUser(req, res) {
    try {
        const { username, password, fullName, email, phone, role } = req.body;

        if (!username || !password || !fullName || !role) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
            });
        }

        const pool = getPool();

        // Kiểm tra username đã tồn tại
        const check = await pool
            .request()
            .input("Username", sql.VarChar(50), username).query(`
                SELECT UserId
                FROM Users
                WHERE Username = @Username
            `);

        if (check.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Username đã tồn tại",
            });
        }

        // Mã hóa mật khẩu bằng bcrypt
        const passwordHash = await bcrypt.hash(password, 10);

        // Tạo user
        const result = await pool
            .request()
            .input("Username", sql.VarChar(50), username)
            .input("PasswordHash", sql.VarChar(255), passwordHash)
            .input("FullName", sql.NVarChar(100), fullName)
            .input("Email", sql.VarChar(100), email || null)
            .input("Phone", sql.VarChar(20), phone || null)
            .input("Role", sql.VarChar(20), role).query(`
                INSERT INTO Users
                (
                    Username,
                    PasswordHash,
                    FullName,
                    Email,
                    Phone,
                    Role,
                    IsActive
                )
                OUTPUT INSERTED.UserId
                VALUES
                (
                    @Username,
                    @PasswordHash,
                    @FullName,
                    @Email,
                    @Phone,
                    @Role,
                    1
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo người dùng thành công",
            data: {
                userId: result.recordset[0].UserId,
            },
        });
    } catch (error) {
        console.error("Create user error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể tạo người dùng",
            error: error.message,
        });
    }
}

// PUT /api/users/:id
async function updateUser(req, res) {
    try {
        const { id } = req.params;

        const { fullName, email, phone, role, isActive } = req.body;

        const pool = getPool();

        const result = await pool
            .request()
            .input("UserId", sql.Int, id)
            .input("FullName", sql.NVarChar(100), fullName)
            .input("Email", sql.VarChar(100), email || null)
            .input("Phone", sql.VarChar(20), phone || null)
            .input("Role", sql.VarChar(20), role)
            .input("IsActive", sql.Bit, isActive).query(`
                UPDATE Users
                SET
                    FullName = @FullName,
                    Email = @Email,
                    Phone = @Phone,
                    Role = @Role,
                    IsActive = @IsActive
                WHERE UserId = @UserId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng",
            });
        }

        res.json({
            success: true,
            message: "Cập nhật người dùng thành công",
        });
    } catch (error) {
        console.error("Update user error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể cập nhật người dùng",
            error: error.message,
        });
    }
}

// DELETE /api/users/:id
async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        const pool = getPool();

        const result = await pool.request().input("UserId", sql.Int, id).query(`
                DELETE FROM Users
                WHERE UserId = @UserId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng",
            });
        }

        res.json({
            success: true,
            message: "Xóa người dùng thành công",
        });
    } catch (error) {
        console.error("Delete user error:", error);

        res.status(500).json({
            success: false,
            message: "Không thể xóa người dùng",
            error: error.message,
        });
    }
}

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
