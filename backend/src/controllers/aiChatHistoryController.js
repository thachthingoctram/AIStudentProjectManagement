const { sql, getPool } = require("../config/db");

// GET /api/ai-chat-history
async function getChatHistories(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                ChatId,
                UserId,
                ProjectId,
                Question,
                Answer,
                CreatedAt
            FROM AI_ChatHistory
            ORDER BY ChatId DESC
        `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("Lỗi getChatHistories:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy lịch sử chatbot",
            error: error.message
        });
    }
}


// GET /api/ai-chat-history/:id
async function getChatHistoryById(req, res) {
    try {
        const chatId = Number(req.params.id);

        if (!Number.isInteger(chatId)) {
            return res.status(400).json({
                success: false,
                message: "ChatId không hợp lệ"
            });
        }

        const pool = getPool();

        const result = await pool
            .request()
            .input("ChatId", sql.Int, chatId)
            .query(`
                SELECT
                    ChatId,
                    UserId,
                    ProjectId,
                    Question,
                    Answer,
                    CreatedAt
                FROM AI_ChatHistory
                WHERE ChatId = @ChatId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lịch sử chatbot"
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {
        console.error("Lỗi getChatHistoryById:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy lịch sử chatbot",
            error: error.message
        });
    }
}


// POST /api/ai-chat-history
async function createChatHistory(req, res) {
    try {
        const {
            UserId,
            ProjectId,
            Question,
            Answer
        } = req.body;

        if (!UserId) {
            return res.status(400).json({
                success: false,
                message: "UserId là bắt buộc"
            });
        }

        if (!Question) {
            return res.status(400).json({
                success: false,
                message: "Question là bắt buộc"
            });
        }

        if (!Answer) {
            return res.status(400).json({
                success: false,
                message: "Answer là bắt buộc"
            });
        }

        const pool = getPool();

        // Kiểm tra User tồn tại
        const userCheck = await pool
            .request()
            .input("UserId", sql.Int, UserId)
            .query(`
                SELECT UserId
                FROM Users
                WHERE UserId = @UserId
            `);

        if (userCheck.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: "UserId không tồn tại"
            });
        }

        // Nếu có ProjectId thì kiểm tra Project tồn tại
        if (ProjectId !== null && ProjectId !== undefined) {
            const projectCheck = await pool
                .request()
                .input("ProjectId", sql.Int, ProjectId)
                .query(`
                    SELECT ProjectId
                    FROM Projects
                    WHERE ProjectId = @ProjectId
                `);

            if (projectCheck.recordset.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "ProjectId không tồn tại"
                });
            }
        }

        const result = await pool
            .request()
            .input("UserId", sql.Int, UserId)
            .input(
                "ProjectId",
                sql.Int,
                ProjectId ?? null
            )
            .input(
                "Question",
                sql.NVarChar(sql.MAX),
                Question
            )
            .input(
                "Answer",
                sql.NVarChar(sql.MAX),
                Answer
            )
            .query(`
                INSERT INTO AI_ChatHistory (
                    UserId,
                    ProjectId,
                    Question,
                    Answer
                )
                OUTPUT INSERTED.*
                VALUES (
                    @UserId,
                    @ProjectId,
                    @Question,
                    @Answer
                )
            `);

        res.status(201).json({
            success: true,
            message: "Lưu lịch sử chatbot thành công",
            data: result.recordset[0]
        });

    } catch (error) {
        console.error("Lỗi createChatHistory:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lưu lịch sử chatbot",
            error: error.message
        });
    }
}


// PUT /api/ai-chat-history/:id
async function updateChatHistory(req, res) {
    try {
        const chatId = Number(req.params.id);

        if (!Number.isInteger(chatId)) {
            return res.status(400).json({
                success: false,
                message: "ChatId không hợp lệ"
            });
        }

        const {
            UserId,
            ProjectId,
            Question,
            Answer
        } = req.body;

        if (!UserId || !Question || !Answer) {
            return res.status(400).json({
                success: false,
                message: "UserId, Question và Answer là bắt buộc"
            });
        }

        const pool = getPool();

        const existing = await pool
            .request()
            .input("ChatId", sql.Int, chatId)
            .query(`
                SELECT ChatId
                FROM AI_ChatHistory
                WHERE ChatId = @ChatId
            `);

        if (existing.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lịch sử chatbot"
            });
        }

        const result = await pool
            .request()
            .input("ChatId", sql.Int, chatId)
            .input("UserId", sql.Int, UserId)
            .input(
                "ProjectId",
                sql.Int,
                ProjectId ?? null
            )
            .input(
                "Question",
                sql.NVarChar(sql.MAX),
                Question
            )
            .input(
                "Answer",
                sql.NVarChar(sql.MAX),
                Answer
            )
            .query(`
                UPDATE AI_ChatHistory
                SET
                    UserId = @UserId,
                    ProjectId = @ProjectId,
                    Question = @Question,
                    Answer = @Answer
                OUTPUT INSERTED.*
                WHERE ChatId = @ChatId
            `);

        res.json({
            success: true,
            message: "Cập nhật lịch sử chatbot thành công",
            data: result.recordset[0]
        });

    } catch (error) {
        console.error("Lỗi updateChatHistory:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật lịch sử chatbot",
            error: error.message
        });
    }
}


// DELETE /api/ai-chat-history/:id
async function deleteChatHistory(req, res) {
    try {
        const chatId = Number(req.params.id);

        if (!Number.isInteger(chatId)) {
            return res.status(400).json({
                success: false,
                message: "ChatId không hợp lệ"
            });
        }

        const pool = getPool();

        const result = await pool
            .request()
            .input("ChatId", sql.Int, chatId)
            .query(`
                DELETE FROM AI_ChatHistory
                OUTPUT DELETED.*
                WHERE ChatId = @ChatId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lịch sử chatbot"
            });
        }

        res.json({
            success: true,
            message: "Xóa lịch sử chatbot thành công",
            data: result.recordset[0]
        });

    } catch (error) {
        console.error("Lỗi deleteChatHistory:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa lịch sử chatbot",
            error: error.message
        });
    }
}


module.exports = {
    getChatHistories,
    getChatHistoryById,
    createChatHistory,
    updateChatHistory,
    deleteChatHistory
};