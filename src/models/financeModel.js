
const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
    type: { type: String, enum: ['Income', 'Expense'], required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
}, { timestamps: true });

module.exports = mongoose.model('Finance', financeSchema);  