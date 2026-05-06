// Path: backend/src/controllers/dishController.js
const { Dish, Ingredient, DishIngredientSupplier } = require('../models');

exports.createDish = async (req, res) => {
    try {
        // Sample Payload: { DishName: "Roasted Shrimp", DishType: "Standard", Calories: 350, Ingredients: [{ IngredientID: 1, SupplierID: 1 }] }
        const { DishName, DishType, Calories, Description, Ingredients } = req.body;

        // Basic Validation
        if (!DishName || !DishType || Calories <= 0) {
            return res.status(400).json({ message: 'Dish name, type, and Calories (>0) are required.' });
        }

        // 1. Save basic dish information
        const newDish = await Dish.create({
            DishName,
            DishType,
            Calories,
            Description
        });

        // 2. Save Dish-Ingredient-Supplier relationships (Traceability)
        if (Ingredients && Ingredients.length > 0) {
            const dishIngredients = Ingredients.map(item => ({
                DishID: newDish.DishID,
                IngredientID: item.IngredientID,
                SupplierID: item.SupplierID
            }));

            // Insert into junction table Dish_Ingredient_Supplier
            await DishIngredientSupplier.bulkCreate(dishIngredients);
        }

        res.status(201).json({
            message: 'Dish created successfully!',
            data: newDish
        });

    } catch (error) {
        console.error('Error creating dish:', error);
        res.status(500).json({ message: 'System error while creating dish.' });
    }
};