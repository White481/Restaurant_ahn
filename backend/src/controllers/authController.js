const userModel = require('../models/userModel');

exports.login = async (req, res) => {
    try {
        // เช็คก่อนว่ามี req.body ส่งมาไหม เพื่อป้องกัน Error: Cannot destructure property
        if (!req.body || !req.body.username) {
            return res.status(400).json({ 
                message: 'Bad Request: Missing username or password'
            });
        }

        const { username, password } = req.body;
        
        const user = await userModel.findUserByUsername(username);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        if (user.password_hash !== password) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        res.json({ 
            message: 'Login successful',
            user: { 
                id: user.user_id, 
                username: user.username, 
                role: user.role, 
                employee_name: `${user.first_name} ${user.last_name}` 
            } 
        });

    } catch (error) {
        // ให้พิมพ์ Error สีแดงลงในหน้าจอ Terminal จะได้รู้ว่า Database มีปัญหาอะไร
        console.error("🔥 Error Details:", error); 
        res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};