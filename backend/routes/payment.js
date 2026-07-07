const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const db = require('../db');

// Create payment (first month payment auto-created on booking)
router.post('/create', auth, async (req, res) => {
  try {
    const { roomId, amount, method } = req.body;
    const userId = req.userId;

    const room = db.findById('rooms', roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check current month payment
    const currentDate = new Date();
    const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const existingPayment = db.find('payments', {
      user: userId,
      room: roomId,
      month: month,
    })[0];

    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Payment for this month is already completed' });
    }

    const payment = {
      user: userId,
      room: roomId,
      amount,
      method,
      month,
      status: 'completed',
      completedAt: new Date().toISOString(),
      transactionId: `TXN-${Date.now()}`,
    };

    const savedPayment = db.add('payments', payment);

    res.json({
      success: true,
      message: 'Payment completed successfully',
      payment: savedPayment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Retrieve payment history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = db.find('payments', { user: req.userId });
    
    // Add room information
    const paymentsWithRoom = payments.map(p => ({
      ...p,
      room: db.findById('rooms', p.room)
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, payments: paymentsWithRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check payment status
router.get('/status/:roomId', auth, async (req, res) => {
  try {
    const currentDate = new Date();
    const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const payment = db.findOne('payments', {
      user: req.userId,
      room: req.params.roomId,
      month: month,
    });

    res.json({ 
      success: true,
      isPaid: payment && payment.status === 'completed',
      payment: payment || null 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all payments
router.get('/admin/all', auth, adminAuth, async (req, res) => {
  try {
    const payments = db.getAll('payments');
    
    const paymentsWithDetails = payments.map(p => ({
      ...p,
      user: db.findById('users', p.user),
      room: db.findById('rooms', p.room)
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({ 
      success: true,
      totalPayments: payments.length,
      totalRevenue,
      payments: paymentsWithDetails 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
