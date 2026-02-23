const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['PAYOS', 'TRANSFER'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED', 'CANCELLED'],
        default: 'PENDING'
    },
    transactionContent: {
        type: String,
        required: true,
        unique: true
    },
    packageInfo: {
        type: String,
        default: 'VIP Pro Lifetime'
    },
    completedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
