const db = require('../config/db');

exports.findUserByUsername = async (username) => {
  // บัญชี login กับข้อมูลพนักงานอยู่ในตาราง staff ตารางเดียว ไม่ต้อง JOIN
  const [rows] = await db.execute('SELECT * FROM staff WHERE username = ?', [username]);
  return rows[0];
};