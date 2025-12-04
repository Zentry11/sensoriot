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

// Railway usa estos nombres de variables
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Verificar conexión
pool.getConnection()
  .then((connection) => {
    console.log("✅ Conexión a MySQL (Railway) establecida");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ Error conectando a MySQL:", err.message);
  });

export default pool; 
