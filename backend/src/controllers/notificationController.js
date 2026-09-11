const { sql, getPool } = require("../config/db");

// GET /api/notifications
async function getNotifications(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                NotificationId,
                UserId,
                Title,
                Message,
                Type,
                IsRead,
                CreatedAt
            FROM Notifications
            ORDER BY NotificationId DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error("Lỗi getNotifications:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách thông báo",
            error: error.message,
        });
    }
}

// GET /api/notifications/:id
async function getNotificationById(req, res) {
    try {
        const notificationId = Number(req.params.id);

        if (!Number.isInteger(notificationId)) {
            return res.status(400).json({
                success: false,
                message: "NotificationId không hợp lệ",
            });
        }

        const pool = getPool();

        const result = await pool
            .request()
            .input("NotificationId", sql.Int, notificationId).query(`
                SELECT
                    NotificationId,
                    UserId,
                    Title,
                    Message,
                    Type,
                    IsRead,
                    CreatedAt
                FROM Notifications
                WHERE NotificationId = @NotificationId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông báo",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi getNotificationById:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông báo",
            error: error.message,
        });
    }
}

// POST /api/notifications
async function createNotification(req, res) {
    try {
        const { UserId, Title, Message, Type, IsRead } = req.body;

        if (!UserId) {
            return res.status(400).json({
                success: false,
                message: "UserId là bắt buộc",
            });
        }

        if (!Title) {
            return res.status(400).json({
                success: false,
                message: "Title là bắt buộc",
            });
        }

        if (!Message) {
            return res.status(400).json({
                success: false,
                message: "Message là bắt buộc",
            });
        }

        if (!Type) {
            return res.status(400).json({
                success: false,
                message: "Type là bắt buộc",
            });
        }

        const pool = getPool();

        // Kiểm tra User tồn tại
        const userCheck = await pool.request().input("UserId", sql.Int, UserId)
            .query(`
                SELECT UserId
                FROM Users
                WHERE UserId = @UserId
            `);

        if (userCheck.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "UserId không tồn tại",
            });
        }

        const result = await pool
            .request()
            .input("UserId", sql.Int, UserId)
            .input("Title", sql.NVarChar(sql.MAX), Title)
            .input("Message", sql.NVarChar(sql.MAX), Message)
            .input("Type", sql.VarChar(50), Type)
            .input("IsRead", sql.Bit, IsRead ?? false).query(`
                INSERT INTO Notifications (
                    UserId,
                    Title,
                    Message,
                    Type,
                    IsRead
                )
                OUTPUT INSERTED.*
                VALUES (
                    @UserId,
                    @Title,
                    @Message,
                    @Type,
                    @IsRead
                )
            `);

        res.status(201).json({
            success: true,
            message: "Tạo thông báo thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi createNotification:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo thông báo",
            error: error.message,
        });
    }
}

// PUT /api/notifications/:id
async function updateNotification(req, res) {
    try {
        const notificationId = Number(req.params.id);

        if (!Number.isInteger(notificationId)) {
            return res.status(400).json({
                success: false,
                message: "NotificationId không hợp lệ",
            });
        }

        const { UserId, Title, Message, Type, IsRead } = req.body;

        if (!UserId || !Title || !Message || !Type) {
            return res.status(400).json({
                success: false,
                message: "UserId, Title, Message và Type là bắt buộc",
            });
        }

        const pool = getPool();

        const existing = await pool
            .request()
            .input("NotificationId", sql.Int, notificationId).query(`
                SELECT NotificationId
                FROM Notifications
                WHERE NotificationId = @NotificationId
            `);

        if (existing.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông báo",
            });
        }

        const userCheck = await pool.request().input("UserId", sql.Int, UserId)
            .query(`
                SELECT UserId
                FROM Users
                WHERE UserId = @UserId
            `);

        if (userCheck.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "UserId không tồn tại",
            });
        }

        const result = await pool
            .request()
            .input("NotificationId", sql.Int, notificationId)
            .input("UserId", sql.Int, UserId)
            .input("Title", sql.NVarChar(sql.MAX), Title)
            .input("Message", sql.NVarChar(sql.MAX), Message)
            .input("Type", sql.VarChar(50), Type)
            .input("IsRead", sql.Bit, IsRead ?? false).query(`
                UPDATE Notifications
                SET
                    UserId = @UserId,
                    Title = @Title,
                    Message = @Message,
                    Type = @Type,
                    IsRead = @IsRead
                OUTPUT INSERTED.*
                WHERE NotificationId = @NotificationId
            `);

        res.json({
            success: true,
            message: "Cập nhật thông báo thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi updateNotification:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật thông báo",
            error: error.message,
        });
    }
}

// DELETE /api/notifications/:id
async function deleteNotification(req, res) {
    try {
        const notificationId = Number(req.params.id);

        if (!Number.isInteger(notificationId)) {
            return res.status(400).json({
                success: false,
                message: "NotificationId không hợp lệ",
            });
        }

        const pool = getPool();

        const result = await pool
            .request()
            .input("NotificationId", sql.Int, notificationId).query(`
                DELETE FROM Notifications
                OUTPUT DELETED.*
                WHERE NotificationId = @NotificationId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông báo",
            });
        }

        res.json({
            success: true,
            message: "Xóa thông báo thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi deleteNotification:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa thông báo",
            error: error.message,
        });
    }
}

module.exports = {
    getNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
};
