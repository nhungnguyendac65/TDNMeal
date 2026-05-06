const { Ingredient } = require('../models');

// ==========================================
// TRANSLATION: Name (Frontend) <--> ID (Database)
// ==========================================
const categoryToId = {
    'Meat & Fish': 1, 'Vegetables': 2, 'Spices': 3, 
    'Dry Goods': 4, 'Milk & Water': 5, 'Other': 6
};
const idToCategory = {
    1: 'Meat & Fish', 2: 'Vegetables', 3: 'Spices', 
    4: 'Dry Goods', 5: 'Milk & Water', 6: 'Other'
};

// 1. Get all ingredients list
exports.getAllIngredients = async (req, res) => {
    try {
        // Sync DB tables on request to ensure schema is up to date
        await Ingredient.sync({ alter: true });

        const ingredients = await Ingredient.findAll({
            order: [['createdAt', 'DESC']]
        });
        
        const formattedData = ingredients.map(ing => ({
            ...ing.toJSON(),
            Name: ing.IngredientName, 
            id: ing.IngredientID,
            Category: idToCategory[ing.CategoryID] || 'Other',
            StockQuantity: ing.StockQuantity ?? 0
        }));

        res.status(200).json({ data: formattedData });
    } catch (error) {
        console.error("Error fetching ingredients:", error);
        res.status(500).json({ message: 'Server error while loading inventory' });
    }
};

// 2. Add new ingredient to inventory
exports.createIngredient = async (req, res) => {
    try {
        const { Name, Category, StockQuantity, Unit, Supplier, MinStockLevel } = req.body;
        
        const newIngredient = await Ingredient.create({
            IngredientName: Name,
            CategoryID: categoryToId[Category] || 6, 
            StockQuantity: Number(StockQuantity) || 0, 
            Unit, 
            Supplier,
            MinStockLevel: Number(MinStockLevel) || 5 
        });

        res.status(201).json({ message: 'Ingredient added!', data: newIngredient });
    } catch (error) {
        console.error("Error adding ingredient:", error);
        res.status(500).json({ message: 'Server error while adding ingredient' });
    }
};

// 3. Update (Add stock / Edit information)
exports.updateIngredient = async (req, res) => {
    try {
        const { id } = req.params;
        const { Name, Category, StockQuantity, Unit, Supplier, MinStockLevel } = req.body;

        const ingredient = await Ingredient.findByPk(id);
        if (!ingredient) return res.status(404).json({ message: 'Ingredient not found!' });

        await ingredient.update({
            IngredientName: Name,
            CategoryID: categoryToId[Category] || 6, 
            StockQuantity: Number(StockQuantity), 
            Unit, 
            Supplier, 
            MinStockLevel: Number(MinStockLevel)
        });

        res.status(200).json({ message: 'Inventory updated!', data: ingredient });
    } catch (error) {
        console.error("Error updating ingredient:", error);
        res.status(500).json({ message: 'Server error while updating ingredient' });
    }
};

// 4. Delete ingredient
exports.deleteIngredient = async (req, res) => {
    try {
        const { id } = req.params;
        const ingredient = await Ingredient.findByPk(id);
        if (!ingredient) return res.status(404).json({ message: 'Ingredient not found!' });

        await ingredient.destroy();
        res.status(200).json({ message: 'Ingredient deleted from inventory!' });
    } catch (error) {
        console.error("Error deleting ingredient:", error);
        res.status(500).json({ message: 'Server error while deleting ingredient' });
    }
};