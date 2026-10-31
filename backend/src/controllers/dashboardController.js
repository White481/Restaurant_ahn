const dashboardModel = require('../models/dashboardModel');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');

const SHOP_TIME_ZONE = 'Asia/Bangkok';

// วันนี้ตามเวลาร้าน (YYYY-MM-DD) ไม่ใช่เวลาของ server (server บน cloud มักเป็น UTC)
const todayInShop = () => new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIME_ZONE }).format(new Date());

// GET /api/dashboard?date=YYYY-MM-DD (date ไม่ใส่ = วันนี้) — สรุปข้อมูลสำหรับหน้า Dashboard ของ admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
    const { date: rawDate } = req.query;
    if (rawDate !== undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || Number.isNaN(Date.parse(rawDate)))) {
        throw new HttpError(400, 'date must be in YYYY-MM-DD format');
    }
    const date = rawDate || todayInShop();

    const [sales, ordersByStatus, topItems, tableStats, ingredients, totalCustomers, totalEmployees, recentOrders] = await Promise.all([
        dashboardModel.getSalesSummary(date),
        dashboardModel.getOrderCountByStatus(date),
        dashboardModel.getTopSellingItems(date, 5),
        dashboardModel.getTableStats(),
        dashboardModel.getIngredientStock(),
        dashboardModel.getTotalCustomers(),
        dashboardModel.getTotalEmployees(),
        dashboardModel.getRecentOrders(10)
    ]);

    res.json({
        date,
        sales, // จาก stored procedure sp_sales_summary
        orders_by_status: ordersByStatus,
        top_items: topItems,
        table_stats: tableStats,
        ingredients,
        total_customers: totalCustomers,
        total_employees: totalEmployees,
        recent_orders: recentOrders
    });
});
