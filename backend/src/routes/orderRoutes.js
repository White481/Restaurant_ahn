const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.createNewOrder);
router.get('/', orderController.getOrders);                // ดึงออเดอร์ทั้งหมด
router.patch('/:id', orderController.updateOrderStatus);   // เปลี่ยนสถานะออเดอร์

module.exports = router;