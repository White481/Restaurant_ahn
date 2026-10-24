require('dotenv').config(); // โหลด .env ก่อน require ไฟล์อื่น

const express = require('express');
const cors = require('cors');

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set. Add it to backend/.env (see .env.example).');
    process.exit(1);
}

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const menuRoutes = require('./routes/menuRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

// CORS_ORIGIN เว้นว่าง = อนุญาตทุกที่ (dev) / ใส่รายการโดเมนเมื่อใช้งานจริง
// ตัด "/" ท้ายออก เพราะ Origin ที่เบราว์เซอร์ส่งมาไม่มี "/" ท้ายเสมอ (ใส่ https://x.vercel.app/ ก็ยังใช้ได้)
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.send('Restaurant API is running...');
});

// ต้องอยู่หลัง routes ทั้งหมด
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app; // export ไว้ให้เขียน test ได้ภายหลัง
