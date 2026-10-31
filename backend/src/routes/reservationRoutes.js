const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { requireAuth } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const staff = requireAuth(PERMISSIONS.manageReservations);

router.post('/', reservationController.createReservation);                                      // Create: ลูกค้าจอง ไม่ต้อง login
router.get('/', staff, reservationController.getReservations);                                  // Read: รายการจองของวัน
router.get('/tables', staff, reservationController.getTables);                                  // โต๊ะทั้งหมด (ไว้ย้ายโต๊ะ)
router.patch('/:id/status', staff, reservationController.updateStatus);                         // Update: ยืนยัน / เช็คอิน / ยกเลิก
router.put('/:id', staff, reservationController.updateReservation);                             // Update: ย้ายโต๊ะ / เปลี่ยนเวลา
router.delete('/:id', requireAuth(PERMISSIONS.deleteReservation), reservationController.deleteReservation); // Delete: admin

module.exports = router;
