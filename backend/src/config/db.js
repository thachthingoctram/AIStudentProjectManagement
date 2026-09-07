const sql = require("mssql/msnodesqlv8");
require("dotenv").config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,

    options: {
        trustedConnection: true,
        trustServerCertificate: true,
    },

    driver: "ODBC Driver 17 for SQL Server",
};

let pool;

async function connectDB() {
    try {
        pool = await sql.connect(config);

        console.log("Kết nối SQL Server thành công");
        console.log(`Server: ${process.env.DB_SERVER}`);
        console.log(`Database: ${process.env.DB_DATABASE}`);

        return pool;
    } catch (error) {
        console.error("Lỗi kết nối SQL Server:");
        console.error(error.message);

        throw error;
    }
}

function getPool() {
    if (!pool) {
        throw new Error("Database chưa được kết nối");
    }

    return pool;
}

module.exports = {
    sql,
    connectDB,
    getPool,
};
