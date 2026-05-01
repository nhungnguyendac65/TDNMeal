const { Ingredient } = require('../models');

// ==========================================
// MÁY DỊCH: Chữ (Frontend) <--> Số (Database)
// ==========================================
const categoryToId = {
    'Thịt & Cá': 1, 'Rau củ quả': 2, 'Gia vị': 3, 
    'Đồ khô': 4, 'Sữa & Nước': 5, 'Khác': 6
};
const idToCategory = {
    1: 'Thịt & Cá', 2: 'Rau củ quả', 3: 'Gia vị', 
    4: 'Đồ khô', 5: 'Sữa & Nước', 6: 'Khác'
};

// 1. Lấy danh sách toàn bộ nguyên liệu
exports.getAllIngredients = async (req, res) => {
    try {
        // 🚨 LỆNH MA THUẬT: Đặt ở đây để ngay khi F5 là DB tự động tạo đủ cột!
        await Ingredient.sync({ alter: true });

        const ingredients = await Ingredient.findAll({
            order: [['createdAt', 'DESC']]
        });
        
        const formattedData = ingredients.map(ing => ({
            ...ing.toJSON(),
            Name: ing.IngredientName, 
            id: ing.IngredientID,
            Category: idToCategory[ing.CategoryID] || 'Khác',
            StockQuantity: ing.StockQuantity ?? 0
        }));

        res.status(200).json({ data: formattedData });
    } catch (error) {
        console.error("Lỗi lấy nguyên liệu:", error);
        res.status(500).json({ message: 'Lỗi server khi tải kho' });
    }
};

// 2. Thêm nguyên liệu mới vào kho
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

        res.status(201).json({ message: 'Đã nhập nguyên liệu!', data: newIngredient });
    } catch (error) {
        console.error("Lỗi thêm nguyên liệu:", error);
        res.status(500).json({ message: 'Lỗi server khi thêm nguyên liệu' });
    }
};

// 3. Cập nhật (Nhập thêm hàng / Sửa thông tin)
exports.updateIngredient = async (req, res) => {
    try {
        const { id } = req.params;
        const { Name, Category, StockQuantity, Unit, Supplier, MinStockLevel } = req.body;

        const ingredient = await Ingredient.findByPk(id);
        if (!ingredient) return res.status(404).json({ message: 'Không tìm thấy nguyên liệu!' });

        await ingredient.update({
            IngredientName: Name,
            CategoryID: categoryToId[Category] || 6, 
            StockQuantity: Number(StockQuantity), 
            Unit, 
            Supplier, 
            MinStockLevel: Number(MinStockLevel)
        });

        res.status(200).json({ message: 'Đã cập nhật kho!', data: ingredient });
    } catch (error) {
        console.error("Lỗi cập nhật nguyên liệu:", error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật nguyên liệu' });
    }
};

// 4. Xóa nguyên liệu
exports.deleteIngredient = async (req, res) => {
    try {
        const { id } = req.params;
        const ingredient = await Ingredient.findByPk(id);
        if (!ingredient) return res.status(404).json({ message: 'Không tìm thấy nguyên liệu!' });

        await ingredient.destroy();
        res.status(200).json({ message: 'Đã xóa nguyên liệu khỏi kho!' });
    } catch (error) {
        console.error("Lỗi xóa nguyên liệu:", error);
        res.status(500).json({ message: 'Lỗi server khi xóa nguyên liệu' });
    }
};