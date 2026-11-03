const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { requireAuth } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

router.get('/', requireAuth(PERMISSIONS.manageTables), tableController.getTables);                       // พนักงาน: รายการโต๊ะ
router.get('/:id', tableController.getTable);                                                          // ลูกค้า: โต๊ะเปิดแล้วหรือยัง
router.patch('/:id/status', requireAuth(PERMISSIONS.manageTables), tableController.updateTableStatus); // เปิด / ปิดโต๊ะ (สิทธิ์ละเอียดเช็กใน controller)

module.exports = router;
