const menuModel = require('../models/menuModel');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');

function toPositiveInt(value) {
    const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    return Number.isInteger(n) && n > 0 ? n : null;
}

// ตรวจและทำความสะอาดข้อมูลเมนูจาก body (ใช้ทั้งตอนเพิ่มและแก้ไข)
function parseMenuBody(body) {
    const { item_name, item_name_en, category, price, image_url, is_active } = body || {};

    if (typeof item_name !== 'string' || !item_name.trim() || item_name.length > 100) {
        throw new HttpError(400, 'item_name is required (max 100 characters)');
    }
    if (item_name_en !== undefined && item_name_en !== null && (typeof item_name_en !== 'string' || item_name_en.length > 100)) {
        throw new HttpError(400, 'item_name_en must be a string (max 100 characters)');
    }
    if (category !== undefined && category !== null && (typeof category !== 'string' || category.length > 50)) {
        throw new HttpError(400, 'category must be a string (max 50 characters)');
    }
    const priceNumber = Number(price);
    if (price === undefined || price === null || price === '' || !Number.isFinite(priceNumber) || priceNumber < 0 || priceNumber > 99999999.99) {
        throw new HttpError(400, 'price must be a non-negative number');
    }
    // รับเฉพาะลิงก์ http(s) กันการใส่ javascript: หรือ data: ลงใน <img src>
    if (image_url !== undefined && image_url !== null && image_url !== '' &&
        (typeof image_url !== 'string' || image_url.length > 500 || !/^https?:\/\/\S+$/i.test(image_url.trim()))) {
        throw new HttpError(400, 'image_url must be an http(s) URL (max 500 characters)');
    }
    if (is_active !== undefined && typeof is_active !== 'boolean') {
        throw new HttpError(400, 'is_active must be true or false');
    }

    return {
        item_name: item_name.trim(),
        item_name_en: typeof item_name_en === 'string' && item_name_en.trim() ? item_name_en.trim() : null,
        category: typeof category === 'string' && category.trim() ? category.trim() : null,
        price: priceNumber,
        image_url: typeof image_url === 'string' && image_url.trim() ? image_url.trim() : null,
        is_active: is_active !== false
    };
}

// GET /api/menus (public) เฉพาะเมนูที่เปิดขาย
exports.getMenus = asyncHandler(async (req, res) => {
    res.json(await menuModel.getActiveMenus());
});

// GET /api/menus/all (admin) รวมเมนูที่ซ่อนไว้
exports.getAllMenus = asyncHandler(async (req, res) => {
    res.json(await menuModel.getAllMenus());
});

// POST /api/menus (admin)
exports.createMenuItem = asyncHandler(async (req, res) => {
    const menuItemId = await menuModel.createMenuItem(parseMenuBody(req.body));
    res.status(201).json({ message: 'Menu item created successfully', menu_item_id: menuItemId });
});

// PUT /api/menus/:id (admin) แก้ไขทั้งรายการ รวมถึงเปิด/ซ่อน (is_active)
exports.updateMenuItem = asyncHandler(async (req, res) => {
    const id = toPositiveInt(req.params.id);
    if (id === null) throw new HttpError(400, 'Invalid menu item id');

    const found = await menuModel.updateMenuItem(id, parseMenuBody(req.body));
    if (!found) throw new HttpError(404, 'Menu item not found');
    res.json({ message: 'Menu item updated successfully', menu_item_id: id });
});

// DELETE /api/menus/:id (admin) ลบจริงถ้ายังไม่เคยถูกสั่ง ไม่อย่างนั้นซ่อนไว้ (result: deleted | hidden)
exports.deleteMenuItem = asyncHandler(async (req, res) => {
    const id = toPositiveInt(req.params.id);
    if (id === null) throw new HttpError(400, 'Invalid menu item id');

    const result = await menuModel.deleteMenuItem(id);
    if (!result) throw new HttpError(404, 'Menu item not found');
    res.json({
        message: result === 'deleted' ? 'Menu item deleted' : 'Menu item has past orders, so it was hidden instead of deleted',
        menu_item_id: id,
        result
    });
});
