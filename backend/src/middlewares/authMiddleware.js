const jwt = require('jsonwebtoken');

// Middleware 1: Verify valid token (Authentication)
exports.verifyToken = (req, res, next) => {
    // Token expected in 'Authorization: Bearer <token>' header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token not found, please login' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'trandainghia_secret_key');
        req.user = decoded; // Attach user info to request
        next(); // Proceed to Controller
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Middleware 2: Check Role (Authorization)
exports.checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};