
const db = require('../config/db');

// เมนูที่ลูกค้าเห็น (เฉพาะที่ยังเปิดขาย)
exports.getActiveMenus = async () => {
    const [rows] = await db.query('SELECT * FROM menu_item WHERE is_active = 1 ORDER BY category, item_name');
    return rows;
};

// เมนูทั้งหมดรวมที่ซ่อนไว้ (หน้าจัดการเมนูของ admin)
exports.getAllMenus = async () => {
    const [rows] = await db.query('SELECT * FROM menu_item ORDER BY is_active DESC, category, item_name');
    return rows;
};

exports.createMenuItem = async ({ item_name, item_name_en, category, price, image_url }) => {
    const [result] = await db.execute(
        'INSERT INTO menu_item (item_name, item_name_en, category, price, image_url) VALUES (?, ?, ?, ?, ?)',
        [item_name, item_name_en || null, category || null, price, image_url || null]
    );
    return result.insertId;
};

// คืน true ถ้าพบเมนูและแก้ไขแล้ว
exports.updateMenuItem = async (id, { item_name, item_name_en, category, price, image_url, is_active }) => {
    const [result] = await db.execute(
        `UPDATE menu_item
         SET item_name = ?, item_name_en = ?, category = ?, price = ?, image_url = ?, is_active = ?
         WHERE menu_item_id = ?`,
        [item_name, item_name_en || null, category || null, price, image_url || null, is_active ? 1 : 0, id]
    );
    return result.affectedRows > 0;
};

// ลบเมนู: ถ้าเคยถูกสั่งแล้ว (order_item อ้างถึงด้วย FK ON DELETE RESTRICT) ลบไม่ได้ -> ซ่อนแทน
// คืน 'deleted' | 'hidden' | null (ไม่พบเมนู)
exports.deleteMenuItem = async (id) => {
    try {
        const [result] = await db.execute('DELETE FROM menu_item WHERE menu_item_id = ?', [id]);
        return result.affectedRows > 0 ? 'deleted' : null;
    } catch (error) {
        if (error.code !== 'ER_ROW_IS_REFERENCED_2') throw error;
        const [result] = await db.execute('UPDATE menu_item SET is_active = 0 WHERE menu_item_id = ?', [id]);
        return result.affectedRows > 0 ? 'hidden' : null;
    }
};
