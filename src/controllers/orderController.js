const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel');
const Finance = require('../models/financeModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        const order = new Order({
            user: req.user._id,
            orderItems,
            shippingAddress,
            paymentInfo: { 
                type: paymentMethod || "Cash on Delivery" 
            }, 
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            orderStatus: "Pending"
        });

        const createdOrder = await order.save();

        // DEDUCT STOCK LOGIC
        if (createdOrder) {
            for (const item of orderItems) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.countInStock = product.countInStock - item.qty;
                    await product.save();
                }
            }
        }

        // FINANCE ENTRY LOGIC
        await Finance.create({
            type: 'Income',
            category: 'Product Sales',
            amount: totalPrice,
            description: `Order #${createdOrder._id}`,
            orderId: createdOrder._id
        });

        // DELETE CART
        await Cart.findOneAndDelete({ user: req.user._id });

        res.status(201).json(createdOrder);
    }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentInfo = {
            id: req.body.id || order.paymentInfo.id,
            status: req.body.status || 'Paid',
            type: order.paymentInfo.type,
        };

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({})
        .populate('user', 'id name email')
        .sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin/Employee
const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    order.orderStatus = req.body.status || order.orderStatus;

    if (req.body.status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
    } else {
        order.isDelivered = false;
        order.deliveredAt = null;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
});

const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        // 1. Security Check: Ensure the user owns this order (or is admin)
        // We compare the Order's user ID with the Logged-in User's ID
        if (order.user.toString() !== req.user._id.toString()) {
             res.status(401);
             throw new Error('Not authorized to cancel this order');
        }

        // 2. Status Check: Can only cancel 'Pending' orders
        // Use 'orderStatus' to match your updateOrderStatus function
        if (order.orderStatus !== 'Pending') {
            res.status(400);
            throw new Error('Cannot cancel an order that is already processed or delivered');
        }

        // 3. Mark as Cancelled
        order.orderStatus = 'Cancelled';
        const updatedOrder = await order.save();

        // 4. RESTOCK INVENTORY (Reverse the deduction logic)
        // We loop through items and ADD the quantity back to the product
        if (order.orderItems && order.orderItems.length > 0) {
            for (const item of order.orderItems) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.countInStock = product.countInStock + item.qty;
                    await product.save();
                }
            }
        }

        // 5. FINANCE REVERSAL
        // Since placing an order added "Income", cancelling it should add an "Expense" (Refund)
        // so your total profit calculation remains correct.
        await Finance.create({
            type: 'Expense',
            category: 'Refund',
            amount: order.totalPrice,
            description: `Refund/Cancel for Order #${order._id}`,
            orderId: order._id
        });

        res.json(updatedOrder);

    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

module.exports = {
    addOrderItems,
    getOrderById,      // <--- Added this
    updateOrderToPaid, // <--- Added this
    getMyOrders,
    getOrders,
    updateOrderStatus,
    cancelOrder
};