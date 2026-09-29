/**
 * =============================================================================
 * Module: Marketplace Order Model
 * Component: /app/backend/models/Order.js
 * Description: Stores customer checkout orders placed via the AgriShop marketplace.
 * =============================================================================
 */

const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, default: 'unit' },
  image: { type: String },
  sellerName: { type: String }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  city: { type: String, default: 'Bangladesh' },
  district: { type: String },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['cod', 'bkash', 'nagad'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: { type: String, default: '' },
  userId: { type: String, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);
