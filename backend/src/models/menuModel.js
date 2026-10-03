const db = require('../config/db');

exports.getAllMenus = async () => {
    const [rows] = await db.query('SELECT * FROM menu_item');
    return rows;
}