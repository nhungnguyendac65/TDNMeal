const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// ==========================================
// QUẢN LÝ THỰC ĐƠN (Mounted at /api/menus)
// ==========================================

// 1. Lấy toàn bộ danh sách thực đơn (Để hiện lên Lịch ở Frontend)
// Sếp nhớ kiểm tra menuController.js đã có hàm getMenus chưa nhé
router.get('/', verifyToken, checkRole(['Admin', 'Kitchen', 'Teacher']), menuController.getMenus);

// 2. Kiểm tra dị ứng chuyên sâu trước khi lưu
router.post('/allergy-check', verifyToken, checkRole(['Kitchen']), menuController.checkMenuAllergy);

// 3. Tạo thực đơn mới
router.post('/', verifyToken, checkRole(['Kitchen']), menuController.createMenu);

// 4. Lấy chi tiết thực đơn theo ngày cụ thể
router.get('/date/:date', verifyToken, checkRole(['Admin', 'Kitchen', 'Teacher']), menuController.getMenuByDate);

// 5. Phê duyệt hoặc từ chối thực đơn (Admin duyệt, Kitchen xem)
router.put('/:id', verifyToken, checkRole(['Admin', 'Kitchen']), menuController.reviewMenu);

module.exports = router;