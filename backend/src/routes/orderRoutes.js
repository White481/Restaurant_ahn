const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// ลูกค้าสั่งอาหารได้โดยไม่ต้อง login (ถ้าพนักงาน login แล้วจะบันทึก employee_id ให้)
router.post('/', optionalAuth, orderController.createNewOrder);

// ลูกค้าติดตามสถานะออเดอร์ตัวเองได้โดยไม่ต้อง login (ได้แค่ status ไม่ได้ข้อมูลอื่น)
router.get('/:id/status', orderController.getOrderStatus);

// ดูออเดอร์ทั้งหมด (Dashboard / ห้องครัว) และอัปเดตสถานะ: ต้อง login เป็นพนักงาน
router.get('/', requireAuth(), orderController.getOrders);
router.patch('/:id', requireAuth(), orderController.updateOrderStatus);

module.exports = router;
