const menuModel = require('../models/menuModel');

exports.getMenus = async (req, res) => {
    try {
        const menus = await menuModel.getAllMenus();
        res.status(200).json(menus);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving menus', error: error.message });
    }
};

// controllers/menuController.js
exports.createMenuItem = async (req, res) => {
  try {
    const { name, price, category } = req.body;
    
    // สั่ง INSERT ลง Database ผ่าน SQL
    const [result] = await db.query(
      'INSERT INTO menu_item (name, price, category) VALUES (?, ?, ?)',
      [name, price, category]
    );

    res.status(201).json({ 
      message: 'Menu item created successfully', 
      menu_item_id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};