const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: {
    type: Number,
    required: true,
    unique: true,
  },
  name: String,
  city: String,
  price: String,
  image: String,
  desc: String,
  phone: String,
  email: String,
  address: String,
  paymentMethods: [String],
  features: [String],
  fullDescription: String,
  isAvailable: {
    type: Boolean,
    default: true,
  },
  occupant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Room', roomSchema);
