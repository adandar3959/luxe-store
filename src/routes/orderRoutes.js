const express = require('express');
const router = express.Router();
const {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getOrders,
  cancelOrder,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Middleware to check if user is Admin OR Employee
const adminOrEmployee = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'employee')) {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as an employee or admin');
    }
};

router.route('/').post(protect, addOrderItems).get(protect, adminOrEmployee, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById).put(protect, adminOrEmployee, updateOrderStatus); // <--- Add PUT here
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, updateOrderStatus);
router.route('/:id/cancel').put(protect, cancelOrder);

module.exports = router;