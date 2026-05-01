const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Cả Admin và Giáo viên đều được xem và duyệt (Backend đã chặn data theo lớp ở trong controller)
router.get('/', verifyToken, checkRole(['Admin', 'Teacher']), paymentController.getAllPayments);
router.put('/:id', verifyToken, checkRole(['Admin', 'Teacher']), paymentController.updatePaymentStatus);

// API riêng cho Admin báo bếp
router.post('/inform-kitchen', verifyToken, checkRole(['Admin']), paymentController.informKitchen);

module.exports = router;

