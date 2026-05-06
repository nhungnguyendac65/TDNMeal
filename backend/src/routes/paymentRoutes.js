const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Both Admin and Teacher can view and approve (Backend filters data by class in controller)
router.get('/', verifyToken, checkRole(['Admin', 'Teacher']), paymentController.getAllPayments);
router.put('/:id', verifyToken, checkRole(['Admin', 'Teacher']), paymentController.updatePaymentStatus);

// Specific API for Admin to notify kitchen
router.post('/inform-kitchen', verifyToken, checkRole(['Admin']), paymentController.informKitchen);

module.exports = router;

