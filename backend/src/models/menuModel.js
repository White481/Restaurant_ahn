const db = require('../config/db');

exports.getAllMenus = async () => {
    const [rows] = await db.query('SELECT * FROM menu_item ORDER BY category, item_name');
    return rows;
};

exports.createMenuItem = async ({ item_name, item_name_en, category, price }) => {
    const [result] = await db.execute(
        'INSERT INTO menu_item (item_name, item_name_en, category, price) VALUES (?, ?, ?, ?)',
        [item_name, item_name_en || null, category || null, price]
    );
    return result.insertId;
};
