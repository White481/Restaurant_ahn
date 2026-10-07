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

// ดึงรายการออเดอร์
exports.getOrders = async (req, res) => {
  const orders = await orderModel.getAllOrders();
  res.json(orders);
};

// เปลี่ยนสถานะออเดอร์
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // <--- ต้องดึง status ออกมาจาก req.body

    // ป้องกันกรณีไม่ได้ส่ง status มา ให้ส่ง error กลับไปแทนที่จะให้ crash 500
    if (!status) {
      return res.status(400).json({ message: 'กรุณาระบุ status' });
    }

    await orderModel.updateStatus(id, status);
    res.json({ message: 'Updated successfully' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
