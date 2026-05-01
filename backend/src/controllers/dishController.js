// Đường dẫn: backend/src/controllers/dishController.js
const { Dish, Ingredient, DishIngredientSupplier } = require('../models');

exports.createDish = async (req, res) => {
    try {
        // Payload mẫu: { DishName: "Tôm rang", DishType: "Mặn", Calories: 350, Ingredients: [{ IngredientID: 1, SupplierID: 1 }] }
        const { DishName, DishType, Calories, Description, Ingredients } = req.body;

        // Validation cơ bản
        if (!DishName || !DishType || Calories <= 0) {
            return res.status(400).json({ message: 'Tên món, loại món và Calories (>0) là bắt buộc.' });
        }

        // 1. Lưu thông tin cơ bản của món ăn
        const newDish = await Dish.create({
            DishName,
            DishType,
            Calories,
            Description
        });

        // 2. Lưu quan hệ Món ăn - Nguyên liệu - Nhà cung cấp (Truy xuất nguồn gốc)
        if (Ingredients && Ingredients.length > 0) {
            const dishIngredients = Ingredients.map(item => ({
                DishID: newDish.DishID,
                IngredientID: item.IngredientID,
                SupplierID: item.SupplierID
            }));

            // Insert vào bảng trung gian Dish_Ingredient_Supplier
            await DishIngredientSupplier.bulkCreate(dishIngredients);
        }

        res.status(201).json({
            message: 'Tạo món ăn thành công!',
            data: newDish
        });

    } catch (error) {
        console.error('Lỗi tạo món ăn:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tạo món ăn.' });
    }
};