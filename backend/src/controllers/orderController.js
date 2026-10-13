const orderModel = require('../models/orderModel');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');

// แปลงค่าเป็นจำนวนเต็มบวก (รับทั้งเลขและ string เลข เช่น "3") ถ้าไม่ใช่คืน null
function toPositiveInt(value) {
    const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    return Number.isInteger(n) && n > 0 ? n : null;
}

exports.createNewOrder = asyncHandler(async (req, res) => {
    const { table_id, order_type, items, special_request, payment_method, session_id, customer_id } = req.body || {};

    const tableId = toPositiveInt(table_id);
    if (tableId === null) throw new HttpError(400, 'table_id must be a positive integer');

    if (!orderModel.ORDER_TYPES.includes(order_type)) {
        throw new HttpError(400, `order_type must be one of: ${orderModel.ORDER_TYPES.join(', ')}`);
    }

    if (payment_method !== undefined && payment_method !== null && !orderModel.PAYMENT_METHODS.includes(payment_method)) {
        throw new HttpError(400, `payment_method must be one of: ${orderModel.PAYMENT_METHODS.join(', ')}`);
    }

    if (special_request !== undefined && special_request !== null &&
        (typeof special_request !== 'string' || special_request.length > 1000)) {
        throw new HttpError(400, 'special_request must be a string (max 1000 characters)');
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw new HttpError(400, 'items must be a non-empty array');
    }
    if (items.length > 100) throw new HttpError(400, 'Too many items in one order');

    const cleanItems = items.map((item) => {
        const menuItemId = toPositiveInt(item && item.menu_item_id);
        const quantity = toPositiveInt(item && item.quantity);
        if (menuItemId === null || quantity === null || quantity > 99) {
            throw new HttpError(400, 'Each item needs a valid menu_item_id and a quantity between 1 and 99');
        }
        return { menu_item_id: menuItemId, quantity };
    });

    const orderData = {
        table_id: tableId,
        order_type,
        special_request: special_request || null,
        payment_method: payment_method || null,
        session_id: session_id ? toPositiveInt(session_id) : null,
        customer_id: customer_id ? toPositiveInt(customer_id) : null,
        // employee_id มาจาก token เท่านั้น (ถ้าพนักงาน login แล้วสั่งแทนลูกค้า) ไม่รับจาก body
        employee_id: req.user ? req.user.employee_id : null
    };

    const result = await orderModel.createOrder(orderData, cleanItems);
    res.status(201).json({
        message: 'Order created successfully',
        order_id: result.orderId,
        total_price: result.totalPrice
    });
});

// GET /api/orders?status=placed  (status เป็น optional)
exports.getOrders = asyncHandler(async (req, res) => {
    const { status } = req.query;
    if (status !== undefined && !orderModel.VALID_STATUSES.includes(status)) {
        throw new HttpError(400, `status must be one of: ${orderModel.VALID_STATUSES.join(', ')}`);
    }
    const orders = await orderModel.getAllOrders({ status });
    res.json(orders);
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const id = toPositiveInt(req.params.id);
    if (id === null) throw new HttpError(400, 'Invalid order id');

    const { status } = (req.body || {});
    if (!status) throw new HttpError(400, 'status is required');
    if (!orderModel.VALID_STATUSES.includes(status)) {
        throw new HttpError(400, `status must be one of: ${orderModel.VALID_STATUSES.join(', ')}`);
    }

    const found = await orderModel.updateStatus(id, status);
    if (!found) throw new HttpError(404, 'Order not found');

    res.json({ message: 'Updated successfully', order_id: id, status });
});
