const db = require('../config/db');

exports.findUserByUsername = async (username) => {
  const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
};