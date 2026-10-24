const mysql = require('mysql2/promise');
require('dotenv').config();

// ไม่ใส่ค่า default ของรหัสผ่านไว้ในโค้ด: ถ้าลืมตั้ง .env ให้ error ชัดๆ ตั้งแต่เริ่ม
const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = required.filter((key) => process.env[key] === undefined);
if (missing.length > 0) {
    throw new Error(
        `Missing environment variables: ${missing.join(', ')}. ` +
        'Copy backend/.env.example to backend/.env and fill in the values.'
    );
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true, // DECIMAL (เช่น price) ส่งกลับเป็น number แทน string
    // DB บน cloud (เช่น TiDB Cloud) บังคับเชื่อมต่อแบบเข้ารหัส: ตั้ง DB_SSL=true ใน .env / ในเครื่องตัวเองไม่ต้องตั้ง
    ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
});

module.exports = pool;
