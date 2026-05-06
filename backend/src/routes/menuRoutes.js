const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// ==========================================
// MENU MANAGEMENT (Mounted at /api/menus)
// ==========================================

// 1. Get all menus (For Calendar display on Frontend)
router.get('/', verifyToken, checkRole(['Admin', 'Kitchen', 'Teacher']), menuController.getMenus);

// 2. Advanced allergy screening before saving
router.post('/allergy-check', verifyToken, checkRole(['Kitchen']), menuController.checkMenuAllergy);

// 3. Create new menu
router.post('/', verifyToken, checkRole(['Kitchen']), menuController.createMenu);

// 4. Get menu details by specific date
router.get('/date/:date', verifyToken, checkRole(['Admin', 'Kitchen', 'Teacher']), menuController.getMenuByDate);

// 5. Approve or Reject menu (Admin approves, Kitchen views)
router.put('/:id', verifyToken, checkRole(['Admin', 'Kitchen']), menuController.reviewMenu);

module.exports = router;