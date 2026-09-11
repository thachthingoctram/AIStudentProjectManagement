const { sql, getPool } = require("../config/db");

// =====================================================
// GET ALL DOCUMENTS
// GET /api/documents
// =====================================================
async function getDocuments(req, res) {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT
                DocumentId,
                ProjectId,
                SubmissionId,
                FileName,
                FileType,
                FilePath,
                FileSize,
                UploadedBy,
                UploadedAt
            FROM Documents
            ORDER BY DocumentId DESC
        `);

        res.json({
            success: true,
            data: result.recordset,
        });
    } catch (error) {
        console.error("Lỗi getDocuments:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách tài liệu",
            error: error.message,
        });
    }
}

// =====================================================
// GET DOCUMENT BY ID
// GET /api/documents/:id
// =====================================================
async function getDocumentById(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool.request().input("DocumentId", sql.Int, id)
            .query(`
                SELECT
                    DocumentId,
                    ProjectId,
                    SubmissionId,
                    FileName,
                    FileType,
                    FilePath,
                    FileSize,
                    UploadedBy,
                    UploadedAt
                FROM Documents
                WHERE DocumentId = @DocumentId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài liệu",
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi getDocumentById:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy tài liệu",
            error: error.message,
        });
    }
}

// =====================================================
// CREATE DOCUMENT
// POST /api/documents
// =====================================================
async function createDocument(req, res) {
    try {
        const pool = getPool();

        const {
            ProjectId,
            SubmissionId,
            FileName,
            FileType,
            FilePath,
            FileSize,
            UploadedBy,
        } = req.body;

        // Kiểm tra dữ liệu bắt buộc
        if (!ProjectId || !FileName || !FilePath) {
            return res.status(400).json({
                success: false,
                message: "ProjectId, FileName và FilePath là bắt buộc",
            });
        }

        // Kiểm tra Project
        const project = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId).query(`
                SELECT ProjectId
                FROM Projects
                WHERE ProjectId = @ProjectId
            `);

        if (project.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project không tồn tại",
            });
        }

        // Nếu có SubmissionId thì kiểm tra Submission
        if (SubmissionId) {
            const submission = await pool
                .request()
                .input("SubmissionId", sql.Int, SubmissionId).query(`
                    SELECT
                        SubmissionId,
                        ProjectId
                    FROM Submissions
                    WHERE SubmissionId = @SubmissionId
                `);

            if (submission.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Submission không tồn tại",
                });
            }

            // Submission phải thuộc đúng Project
            if (submission.recordset[0].ProjectId !== Number(ProjectId)) {
                return res.status(400).json({
                    success: false,
                    message: "Submission không thuộc Project này",
                });
            }
        }

        // Nếu có UploadedBy thì kiểm tra User
        if (UploadedBy) {
            const user = await pool
                .request()
                .input("UserId", sql.Int, UploadedBy).query(`
                    SELECT UserId
                    FROM Users
                    WHERE UserId = @UserId
                `);

            if (user.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Người upload không tồn tại",
                });
            }
        }

        // Thêm Document
        const result = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId)
            .input("SubmissionId", sql.Int, SubmissionId || null)
            .input("FileName", sql.NVarChar, FileName)
            .input("FileType", sql.VarChar, FileType || null)
            .input("FilePath", sql.NVarChar, FilePath)
            .input("FileSize", sql.BigInt, FileSize ?? null)
            .input("UploadedBy", sql.Int, UploadedBy || null).query(`
                INSERT INTO Documents
                (
                    ProjectId,
                    SubmissionId,
                    FileName,
                    FileType,
                    FilePath,
                    FileSize,
                    UploadedBy
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @ProjectId,
                    @SubmissionId,
                    @FileName,
                    @FileType,
                    @FilePath,
                    @FileSize,
                    @UploadedBy
                )
            `);

        res.status(201).json({
            success: true,
            message: "Thêm tài liệu thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi createDocument:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi thêm tài liệu",
            error: error.message,
        });
    }
}

// =====================================================
// UPDATE DOCUMENT
// PUT /api/documents/:id
// =====================================================
async function updateDocument(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const {
            ProjectId,
            SubmissionId,
            FileName,
            FileType,
            FilePath,
            FileSize,
            UploadedBy,
        } = req.body;

        // Kiểm tra dữ liệu bắt buộc
        if (!ProjectId || !FileName || !FilePath) {
            return res.status(400).json({
                success: false,
                message: "ProjectId, FileName và FilePath là bắt buộc",
            });
        }

        // Kiểm tra Document
        const document = await pool.request().input("DocumentId", sql.Int, id)
            .query(`
                SELECT DocumentId
                FROM Documents
                WHERE DocumentId = @DocumentId
            `);

        if (document.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài liệu",
            });
        }

        // Kiểm tra Project
        const project = await pool
            .request()
            .input("ProjectId", sql.Int, ProjectId).query(`
                SELECT ProjectId
                FROM Projects
                WHERE ProjectId = @ProjectId
            `);

        if (project.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project không tồn tại",
            });
        }

        // Kiểm tra Submission nếu có
        if (SubmissionId) {
            const submission = await pool
                .request()
                .input("SubmissionId", sql.Int, SubmissionId).query(`
                    SELECT
                        SubmissionId,
                        ProjectId
                    FROM Submissions
                    WHERE SubmissionId = @SubmissionId
                `);

            if (submission.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Submission không tồn tại",
                });
            }

            if (submission.recordset[0].ProjectId !== Number(ProjectId)) {
                return res.status(400).json({
                    success: false,
                    message: "Submission không thuộc Project này",
                });
            }
        }

        // Kiểm tra User upload nếu có
        if (UploadedBy) {
            const user = await pool
                .request()
                .input("UserId", sql.Int, UploadedBy).query(`
                    SELECT UserId
                    FROM Users
                    WHERE UserId = @UserId
                `);

            if (user.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Người upload không tồn tại",
                });
            }
        }

        // Cập nhật
        const result = await pool
            .request()
            .input("DocumentId", sql.Int, id)
            .input("ProjectId", sql.Int, ProjectId)
            .input("SubmissionId", sql.Int, SubmissionId || null)
            .input("FileName", sql.NVarChar, FileName)
            .input("FileType", sql.VarChar, FileType || null)
            .input("FilePath", sql.NVarChar, FilePath)
            .input("FileSize", sql.BigInt, FileSize ?? null)
            .input("UploadedBy", sql.Int, UploadedBy || null).query(`
                UPDATE Documents
                SET
                    ProjectId = @ProjectId,
                    SubmissionId = @SubmissionId,
                    FileName = @FileName,
                    FileType = @FileType,
                    FilePath = @FilePath,
                    FileSize = @FileSize,
                    UploadedBy = @UploadedBy
                OUTPUT INSERTED.*
                WHERE DocumentId = @DocumentId
            `);

        res.json({
            success: true,
            message: "Cập nhật tài liệu thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi updateDocument:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật tài liệu",
            error: error.message,
        });
    }
}

// =====================================================
// DELETE DOCUMENT
// DELETE /api/documents/:id
// =====================================================
async function deleteDocument(req, res) {
    try {
        const pool = getPool();
        const { id } = req.params;

        const result = await pool.request().input("DocumentId", sql.Int, id)
            .query(`
                DELETE FROM Documents
                OUTPUT DELETED.*
                WHERE DocumentId = @DocumentId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài liệu",
            });
        }

        res.json({
            success: true,
            message: "Xóa tài liệu thành công",
            data: result.recordset[0],
        });
    } catch (error) {
        console.error("Lỗi deleteDocument:", error);

        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa tài liệu",
            error: error.message,
        });
    }
}

// =====================================================
// EXPORT
// =====================================================
module.exports = {
    getDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
};
