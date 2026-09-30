const userModel = require('../models/userModel');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await userModel.findUserByUsername(username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        if (user.password_hash !== password) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        res.json({ message: 'Login successful',
             user: { id: user.user_id, 
                username: user.username, 
                role: user.role, 
                employee_name: `${user.first_name} ${user.last_name}` 
            } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};