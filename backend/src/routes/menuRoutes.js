const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { requireAuth } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const adminOnly = requireAuth(PERMISSIONS.manageMenu);

router.get('/', menuController.getMenus);                           // ลูกค้าดูเมนูได้ ไม่ต้อง login (เฉพาะที่เปิดขาย)
router.get('/all', adminOnly, menuController.getAllMenus);          // admin: รวมเมนูที่ซ่อนไว้
router.post('/', adminOnly, menuController.createMenuItem);        // Create
router.put('/:id', adminOnly, menuController.updateMenuItem);      // Update (รวมเปิด/ซ่อน)
router.delete('/:id', adminOnly, menuController.deleteMenuItem);   // Delete (เคยถูกสั่งแล้ว -> ซ่อนแทน)

module.exports = router;
