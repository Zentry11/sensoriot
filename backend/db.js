/*import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default db; */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Crear pool de conexiones SIN await
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Función para verificar conexión
pool.getConnection()
  .then((connection) => {
    console.log("✅ Conexión a MySQL establecida");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ Error conectando a MySQL:", err);
  });

export default pool;
