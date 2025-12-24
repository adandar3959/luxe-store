const express = require('express');
const router = express.Router();

const { 
    getDashboardStats, 
    getCustomers, 
    getEmployees, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee 
} = require('../controllers/adminController');

const { getFinanceStats, paySalary } = require('../controllers/financeController');

const { protect, admin } = require('../middleware/authMiddleware');

// Dashboard & Customers
router.get('/stats', protect, admin, getDashboardStats);
router.get('/customers', protect, admin, getCustomers);

// Finance & Payroll
router.get('/finance', protect, admin, getFinanceStats);
router.post('/finance/pay-salary', protect, admin, paySalary);

// Employee Management
router.route('/employees')
    .get(protect, admin, getEmployees)
    .post(protect, admin, createEmployee);

router.route('/employees/:id')
    .put(protect, admin, updateEmployee)
    .delete(protect, admin, deleteEmployee);

module.exports = router;