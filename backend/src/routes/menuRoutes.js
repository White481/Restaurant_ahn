const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { requireAuth } = require('../middleware/auth');

router.get('/', menuController.getMenus);                                   // ลูกค้าดูเมนูได้ ไม่ต้อง login
router.post('/', requireAuth(['admin']), menuController.createMenuItem);   // เพิ่มเมนู: admin เท่านั้น

module.exports = router;
