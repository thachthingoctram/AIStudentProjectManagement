const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { getPool, sql } = require("../config/db");

async function login(req, res) {
    try {
        const { username, password } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập username và password",
            });
        }

        const pool = getPool();

        // Tìm tài khoản
        const result = await pool
            .request()
            .input("Username", sql.VarChar(50), username).query(`
                SELECT
                    UserId,
                    Username,
                    PasswordHash,
                    FullName,
                    Email,
                    Phone,
                    Role,
                    IsActive
                FROM Users
                WHERE Username = @Username
            `);

        // Không tìm thấy tài khoản
        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Tài khoản hoặc mật khẩu không đúng",
            });
        }

        const user = result.recordset[0];

        // Kiểm tra tài khoản có bị khóa không
        if (!user.IsActive) {
            return res.status(403).json({
                success: false,
                message: "Tài khoản đã bị khóa",
            });
        }

        /*
         * Tạm thời so sánh trực tiếp mật khẩu.
         *
         * Nếu database của bạn đang lưu PasswordHash
         * bằng bcrypt thì sau này đổi sang bcrypt.compare().
         */
        let isPasswordValid = false;

        if (user.PasswordHash.startsWith("$2")) {
            // Mật khẩu đã được mã hóa bằng bcrypt
            isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
        } else {
            // Mật khẩu cũ chưa mã hóa
            isPasswordValid = password === user.PasswordHash;

            // Nếu đúng mật khẩu thì tự động mã hóa lại
            if (isPasswordValid) {
                const newPasswordHash = await bcrypt.hash(password, 10);

                await pool
                    .request()
                    .input("UserId", sql.Int, user.UserId)
                    .input("PasswordHash", sql.VarChar(255), newPasswordHash)
                    .query(`
                UPDATE Users
                SET PasswordHash = @PasswordHash
                WHERE UserId = @UserId
            `);
            }
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Tài khoản hoặc mật khẩu không đúng",
            });
        }

        // Tạo JWT
        const token = jwt.sign(
            {
                userId: user.UserId,
                username: user.Username,
                role: user.Role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d",
            },
        );

        // Trả kết quả
        return res.json({
            success: true,
            message: "Đăng nhập thành công",
            data: {
                token,
                user: {
                    userId: user.UserId,
                    username: user.Username,
                    fullName: user.FullName,
                    email: user.Email,
                    phone: user.Phone,
                    role: user.Role,
                },
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error.message,
        });
    }
}

module.exports = {
    login,
};
