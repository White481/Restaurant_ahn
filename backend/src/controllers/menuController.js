const menuModel = require('../models/menuModel');

exports.getMenus = async (req, res) => {
    try {
        const menus = await menuModel.getAllMenus();
        res.status(200).json(menus);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving menus', error: error.message });
    }
};