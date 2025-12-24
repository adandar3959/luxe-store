const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');

//GET /api/admin/dashboard

const getDashboardStats = asyncHandler(async (req, res) => {
    
    // 1. Total Sales: Sum of totalPrice for all orders that are NOT Cancelled
    const totalSalesData = await Order.aggregate([
        { 
            $match: { 
                orderStatus: { $ne: 'Cancelled' } // 👈 Filter out Cancelled
            } 
        },
        { 
            $group: { 
                _id: null, 
                total: { $sum: "$totalPrice" } 
            } 
        }
    ]);
    const totalSales = totalSalesData.length > 0 ? totalSalesData[0].total : 0;

    // 2. Total Orders: Count of orders that are NOT Cancelled
    const totalOrders = await Order.countDocuments({ 
        orderStatus: { $ne: 'Cancelled' } 
    });

    // 3. Products Sold: Sum of quantities of all items in non-cancelled orders
    const productSoldData = await Order.aggregate([
        { 
            $match: { 
                orderStatus: { $ne: 'Cancelled' } 
            } 
        },
        { $unwind: "$orderItems" }, // Break down arrays to individual items
        { 
            $group: { 
                _id: null, 
                totalQty: { $sum: "$orderItems.qty" } 
            } 
        }
    ]);
    const productSold = productSoldData.length > 0 ? productSoldData[0].totalQty : 0;

    // 4. Customer Count
    const customerCount = await User.countDocuments({ role: 'customer' });

    // 5. Recent Customers
    const recentCustomers = await User.find({ role: 'customer' })
        .sort({ createdAt: -1 })
        .limit(5);

    // 6. Top Products (Just getting first 5 for now)
    const topProducts = await Product.find({}).limit(5);

    res.json({
        totalSales,
        totalOrders,
        productSold,
        customerCount,
        recentCustomers,
        topProducts
    });
});

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private/Admin
const getCustomers = asyncHandler(async (req, res) => {
    const customers = await User.find({ role: 'customer' }).select('-password');
    res.json(customers);
});

// @desc    Get all employees
// @route   GET /api/admin/employees
// @access  Private/Admin
const getEmployees = asyncHandler(async (req, res) => {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json(employees);
});

// @desc    Create new employee
// @route   POST /api/admin/employees
// @access  Private/Admin
const createEmployee = asyncHandler(async (req, res) => {
    const { name, email, password, salary, position } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name, 
        email, 
        password, 
        salary, 
        position,
        role: 'employee'
    });

    if (user) {
        res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Update employee details
// @route   PUT /api/admin/employees/:id
// @access  Private/Admin
const updateEmployee = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if(user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.salary = req.body.salary || user.salary;
        user.position = req.body.position || user.position;
        
        if(req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json({ _id: updatedUser._id, name: updatedUser.name, salary: updatedUser.salary });
    } else {
        res.status(404);
        throw new Error('Employee not found');
    }
});

// @desc    Delete employee
// @route   DELETE /api/admin/employees/:id
// @access  Private/Admin
const deleteEmployee = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        await user.deleteOne();
        res.json({ message: 'Employee removed' });
    } else {
        res.status(404);
        throw new Error('Employee not found');
    }
});

module.exports = { 
    getDashboardStats, 
    getCustomers, 
    getEmployees, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee 
};