const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  method: {
    type: String,
    enum: ['Credit Card', 'Bank Transfer', 'PayPal', 'Kakao Pay', 'Naver Pay', 'Apple Pay'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  month: {
    type: String,
    required: true, // YYYY-MM format
  },
  transactionId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
});

// 이전 달 결제 존재 여부 확인
paymentSchema.statics.getMonthlyPayments = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return await this.find({
    user: userId,
    createdAt: { $gte: startDate, $lte: endDate },
  });
};

module.exports = mongoose.model('Payment', paymentSchema);
