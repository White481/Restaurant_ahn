const orderModel = require('../models/orderModel');

exports.createNewOrder = async (req, res) => {
    const { table_id, order_type, items, special_request, payment_method } = req.body;

    if (!table_id || !order_type || !items || items.length === 0) {
        return res.status(400).json({ message: 'Missing required order details' });
    }

    try {
        const result = await orderModel.createOrder(req.body, items);
        res.status(201).json({
            message: 'Order created successfully',
            order_id: result.orderId,
            total_price: result.totalPrice
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    }
};