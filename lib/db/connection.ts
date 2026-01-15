
import { createPool, Pool } from "mysql2/promise"

const poolConfig = {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "db",
    namedPlaceholders: true,
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || "10"),
    queueLimit: parseInt(process.env.MYSQL_QUEUE_LIMIT || "0"),
    waitForConnections: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
}

export const database: Pool = createPool(poolConfig)

if (typeof process !== "undefined") {
    const shutdown = async () => {
        try {
            await database?.end()
        } catch (_error: any) {
            // 
        }
    }

    process.on("SIGTERM", shutdown)
    process.on("SIGINT", shutdown)
}