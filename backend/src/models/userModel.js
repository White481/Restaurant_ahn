const db = require('../config/db');

exports.findUserByUsername = async (username) => {
  // ใช้ JOIN เพื่อดึงข้อมูลบัญชีผู้ใช้ พร้อมกับชื่อ-นามสกุลจากตาราง employee
  const query = `
    SELECT sys_user.*, employee.first_name, employee.last_name 
    FROM sys_user 
    JOIN employee ON sys_user.employee_id = employee.employee_id 
    WHERE sys_user.username = ?
  `;
  
  const [rows] = await db.execute(query, [username]);
  return rows[0];
};