const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize'); 

exports.login = async (req, res) => {
    try {
        // 1. Lấy dữ liệu từ Frontend gửi lên (Bao lô cả username hoặc Phone)
        const loginId = req.body.username || req.body.Phone; 
        const loginPass = req.body.password || req.body.Password;

        if (!loginId || !loginPass) {
            return res.status(400).json({ message: 'Vui lòng nhập tài khoản và mật khẩu!' });
        }

        // 2. Tìm user theo Số điện thoại HOẶC Tên đăng nhập
        const user = await User.findOne({ 
            where: { 
                [Op.or]: [
                    { Phone: loginId },
                    { Username: loginId } 
                ]
            } 
        });

        if (!user) {
            return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
        }

        // 3. Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(loginPass, user.PasswordHash);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
        }

        // 4. Kiểm tra trạng thái tài khoản
        if (user.Status === 'Inactive') {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
        }

        // 5. Tạo JWT Token
        const payload = {
            userId: user.UserID,
            role: user.Role,
            fullName: user.FullName
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || 'trandainghia_secret_key', { expiresIn: '1d' });

        // 6. Trả về kết quả cho Frontend
        res.status(200).json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.UserID,
                fullName: user.FullName,
                role: user.Role,
                username: user.Username,
                phone: user.Phone
            }
        });

    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        console.log("--- BẮT ĐẦU CẬP NHẬT HỒ SƠ ---");
        console.log("UserID từ Token:", req.user?.userId);
        console.log("Dữ liệu nhận được:", req.body);

        const userId = req.user.userId;
        const { FullName, Phone, Password } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            console.log("LỖI: Không tìm thấy User với ID:", userId);
            return res.status(404).json({ message: 'User not found' });
        }

        if (Phone && Phone !== user.Phone) {
            console.log("Yêu cầu đổi Phone từ", user.Phone, "thành", Phone);
            const existingPhone = await User.findOne({ where: { Phone, UserID: { [Op.ne]: userId } } });
            if (existingPhone) {
                console.log("LỖI: Số điện thoại đã tồn tại:", Phone);
                return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng bởi người khác' });
            }
            user.Phone = Phone;
        }

        if (FullName) {
            user.FullName = FullName;
        }

        if (Password && Password.trim() !== '') {
            console.log("Tiến hành băm mật khẩu mới...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(Password, salt);
            user.PasswordHash = hashedPassword;
            console.log("Đã băm xong mật khẩu.");
        }

        await user.save();
        console.log("Lưu User vào Database thành công!");

        res.status(200).json({
            message: 'Cập nhật hồ sơ thành công',
            user: {
                id: user.UserID,
                fullName: user.FullName,
                role: user.Role,
                phone: user.Phone,
                username: user.Username
            }
        });
    } catch (error) {
        console.error('Lỗi cập nhật hồ sơ:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};