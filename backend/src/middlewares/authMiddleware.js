const jwt = require('jsonwebtoken');

// Middleware 1: Kiểm tra xem user có token hợp lệ không (Đã đăng nhập chưa)
exports.verifyToken = (req, res, next) => {
    // Frontend sẽ gửi token qua header 'Authorization: Bearer <token>'
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Không tìm thấy token, vui lòng đăng nhập' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'trandainghia_secret_key');
        req.user = decoded; // Gắn thông tin user vào request để các hàm sau sử dụng
        next(); // Cho phép đi tiếp vào Controller
    } catch (error) {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};

// Middleware 2: Kiểm tra Role (Phân quyền)
exports.checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
        }
        next();
    };
};