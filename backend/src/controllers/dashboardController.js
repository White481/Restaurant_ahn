const dashboardModel = require('../models/dashboardModel');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/dashboard — สรุปข้อมูลสำหรับหน้า Dashboard ของ admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
    const [
        todayRevenue,
        ordersByStatus,
        avgOrderValue,
        topItems,
        tableStats,
        totalCustomers,
        totalEmployees,
        recentOrders
    ] = await Promise.all([
        dashboardModel.getTodayRevenue(),
        dashboardModel.getTodayOrderCountByStatus(),
        dashboardModel.getTodayAverageOrderValue(),
        dashboardModel.getTopSellingItems(5),
        dashboardModel.getTableStats(),
        dashboardModel.getTotalCustomers(),
        dashboardModel.getTotalEmployees(),
        dashboardModel.getRecentOrders(10)
    ]);

    const todayOrderCount = Object.values(ordersByStatus).reduce((sum, n) => sum + n, 0);

    res.json({
        today_revenue: todayRevenue,
        today_order_count: todayOrderCount,
        orders_by_status: ordersByStatus,
        avg_order_value: Math.round(avgOrderValue * 100) / 100,
        top_items: topItems,
        table_stats: tableStats,
        total_customers: totalCustomers,
        total_employees: totalEmployees,
        recent_orders: recentOrders
    });
});
