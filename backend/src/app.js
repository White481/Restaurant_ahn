const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const menuRoutes = require('./routes/menuRoutes');


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menus', menuRoutes);
// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Restaurant API is running...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});