const menuModel = require('../models/menuModel');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');

exports.getMenus = asyncHandler(async (req, res) => {
    const menus = await menuModel.getAllMenus();
    res.status(200).json(menus);
});

exports.createMenuItem = asyncHandler(async (req, res) => {
    const { item_name, category, price } = req.body || {};

    if (typeof item_name !== 'string' || !item_name.trim() || item_name.length > 100) {
        throw new HttpError(400, 'item_name is required (max 100 characters)');
    }
    if (category !== undefined && category !== null && (typeof category !== 'string' || category.length > 50)) {
        throw new HttpError(400, 'category must be a string (max 50 characters)');
    }
    const priceNumber = Number(price);
    if (price === undefined || price === null || price === '' || !Number.isFinite(priceNumber) || priceNumber < 0) {
        throw new HttpError(400, 'price must be a non-negative number');
    }

    const menuItemId = await menuModel.createMenuItem({
        item_name: item_name.trim(),
        category,
        price: priceNumber
    });

    res.status(201).json({
        message: 'Menu item created successfully',
        menu_item_id: menuItemId
    });
});
