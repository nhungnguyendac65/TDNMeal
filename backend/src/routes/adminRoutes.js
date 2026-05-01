const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.get('/users', verifyToken, checkRole(['Admin']), adminController.getAllUsers);
router.post('/users', verifyToken, checkRole(['Admin']), adminController.createUser);
router.put('/users/:id', verifyToken, checkRole(['Admin']), adminController.updateUser);
router.delete('/users/:id', verifyToken, checkRole(['Admin']), adminController.deleteUser);

router.get('/stats', verifyToken, checkRole(['Admin']), adminController.getAdminStats);

module.exports = router;