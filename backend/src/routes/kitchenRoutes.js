const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const kitchenController = require('../controllers/kitchenController');
const ingredientController = require('../controllers/ingredientController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/dishes/') 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// ==========================================
// KITCHEN ROUTES (Kitchen and Inventory focus)
// ==========================================

// 1. Kitchen Dashboard
router.get('/dashboard', verifyToken, checkRole(['Kitchen']), kitchenController.getKitchenDashboard);

// 2. Dish Management
router.get('/dishes', verifyToken, checkRole(['Kitchen']), kitchenController.getAllDishes);
router.post('/dishes', verifyToken, checkRole(['Kitchen']), upload.single('image'), kitchenController.createDish);
router.put('/dishes/:id', verifyToken, checkRole(['Kitchen']), upload.single('image'), kitchenController.updateDish);
router.delete('/dishes/:id', verifyToken, checkRole(['Kitchen']), kitchenController.deleteDish);

// 3. Ingredient Management
router.get('/ingredients', verifyToken, checkRole(['Kitchen']), ingredientController.getAllIngredients);
router.post('/ingredients', verifyToken, checkRole(['Kitchen']), ingredientController.createIngredient);
router.put('/ingredients/:id', verifyToken, checkRole(['Kitchen']), ingredientController.updateIngredient);
router.delete('/ingredients/:id', verifyToken, checkRole(['Kitchen']), ingredientController.deleteIngredient);

module.exports = router;