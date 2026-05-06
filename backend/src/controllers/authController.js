const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize'); 

exports.login = async (req, res) => {
    try {
        // 1. Get data from Frontend (username or Phone)
        const loginId = req.body.username || req.body.Phone; 
        const loginPass = req.body.password || req.body.Password;

        if (!loginId || !loginPass) {
            return res.status(400).json({ message: 'Please enter account and password!' });
        }

        // 2. Find user by Phone OR Username
        const user = await User.findOne({ 
            where: { 
                [Op.or]: [
                    { Phone: loginId },
                    { Username: loginId } 
                ]
            } 
        });

        if (!user) {
            return res.status(401).json({ message: 'Incorrect account or password' });
        }

        // 3. Verify password
        const isMatch = await bcrypt.compare(loginPass, user.PasswordHash);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect account or password' });
        }

        // 4. Check account status
        if (user.Status === 'Inactive') {
            return res.status(403).json({ message: 'Your account has been locked' });
        }

        // 5. Generate JWT Token
        const payload = {
            userId: user.UserID,
            role: user.Role,
            fullName: user.FullName
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || 'trandainghia_secret_key', { expiresIn: '1d' });

        // 6. Return response to Frontend
        res.status(200).json({
            message: 'Login successful',
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
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        console.log("--- STARTING PROFILE UPDATE ---");
        console.log("UserID from Token:", req.user?.userId);
        console.log("Received data:", req.body);

        const userId = req.user.userId;
        const { FullName, Phone, Password } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            console.log("ERROR: User not found with ID:", userId);
            return res.status(404).json({ message: 'User not found' });
        }

        if (Phone && Phone !== user.Phone) {
            console.log("Request to change Phone from", user.Phone, "to", Phone);
            const existingPhone = await User.findOne({ where: { Phone, UserID: { [Op.ne]: userId } } });
            if (existingPhone) {
                console.log("ERROR: Phone number already exists:", Phone);
                return res.status(400).json({ message: 'This phone number is already used by another account' });
            }
            user.Phone = Phone;
        }

        if (FullName) {
            user.FullName = FullName;
        }

        if (Password && Password.trim() !== '') {
            console.log("Hashing new password...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(Password, salt);
            user.PasswordHash = hashedPassword;
            console.log("Password hashed successfully.");
        }

        await user.save();
        console.log("User saved to Database successfully!");

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: user.UserID,
                fullName: user.FullName,
                role: user.Role,
                phone: user.Phone,
                username: user.Username
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};