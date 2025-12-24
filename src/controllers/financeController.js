const asyncHandler = require('express-async-handler');
const Finance = require('../models/financeModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');

const getFinanceStats = asyncHandler(async (req, res) => {

    const incomes = await Finance.find({ type: 'Income' });
    const expenses = await Finance.find({ type: 'Expense' });

    const totalRevenue = incomes.reduce((acc, item) => acc + item.amount, 0);
    const totalExpenses = expenses.reduce((acc, item) => acc + item.amount, 0);
    const netProfit = totalRevenue - totalExpenses;


    const transactions = await Finance.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('employeeId', 'name');

    //  Employee Salary
    const employees = await User.find({ role: 'employee' }).select('name position salary lastPaidDate');
    
    const now = new Date();
    const currentMonth = now.getMonth(); 
    const currentYear = now.getFullYear(); 

    const employeeStatus = employees.map(emp => {
        let isPaid = false;

        if (emp.lastPaidDate) {
            const paidDate = new Date(emp.lastPaidDate);

            if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
                isPaid = true;
            }
        }

        return {
            _id: emp._id,
            name: emp.name,
            position: emp.position,
            salary: emp.salary,
            status: isPaid ? 'Paid' : 'Unpaid'
        };
    });

    res.json({
        totalRevenue,
        totalExpenses,
        netProfit,
        transactions,
        employeeStatus
    });
});

const paySalary = asyncHandler(async (req, res) => {
    const { employeeId, amount } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
        res.status(404);
        throw new Error('Employee not found');
    }
    await Finance.create({
        type: 'Expense',
        category: 'Salary',
        amount: Number(amount),
        description: `Salary Payment to ${employee.name}`,
        employeeId: employee._id
    });

    employee.lastPaidDate = new Date();
    await employee.save();

    res.json({ message: 'Salary Paid Successfully' });
});

module.exports = { getFinanceStats, paySalary };