const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// ลูกค้าสั่งอาหารได้โดยไม่ต้อง login (ถ้าพนักงาน login แล้วจะบันทึก employee_id ให้)
router.post('/', optionalAuth, orderController.createNewOrder);

// ลูกค้าติดตามสถานะออเดอร์ตัวเองได้โดยไม่ต้อง login (ได้แค่ status ไม่ได้ข้อมูลอื่น)
router.get('/:id/status', orderController.getOrderStatus);

// ดูออเดอร์ทั้งหมด (ห้องครัว / หน้าร้าน): ต้อง login เป็นพนักงาน
router.get('/', requireAuth(PERMISSIONS.viewOrders), orderController.getOrders);

// อัปเดตสถานะ: ทุก role เรียกได้ แต่ controller ตรวจว่า role นี้เปลี่ยนจากสถานะไหนไปสถานะไหนได้ (ORDER_TRANSITIONS)
router.patch('/:id', requireAuth(PERMISSIONS.viewOrders), orderController.updateOrderStatus);

// รับชำระเงิน + ปิดออเดอร์ (ไม่ให้ครัวรับเงิน)
router.post('/:id/pay', requireAuth(PERMISSIONS.payOrder), orderController.payOrder);

module.exports = router;
