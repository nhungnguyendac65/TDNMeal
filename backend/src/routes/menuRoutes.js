const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// ==========================================
// MENU MANAGEMENT (Mounted at /api/menus)
// ==========================================

// 1. Get all menus (For the frontend calendar)
router.get('/', verifyToken, checkRole(['Admin', 'Kitchen', 'Teacher']), menuController.getMenus);

// 2. Detailed allergy check before saving
router.post('/allergy-check', verifyToken, checkRole(['Kitchen']), menuController.checkMenuAllergy);

// 3. Create new menu
router.post('/', verifyToken, checkRole(['Kitchen']), menuController.createMenu);

// 4. Get menu details by specific date
router.get('/date/:date', verifyToken, checkRole(['Admin', 'Kitchen', 'Teacher']), menuController.getMenuByDate);

// 5. Approve or reject menu (Admin approves, Kitchen views)
router.put('/:id', verifyToken, checkRole(['Admin', 'Kitchen']), menuController.reviewMenu);

module.exports = router;