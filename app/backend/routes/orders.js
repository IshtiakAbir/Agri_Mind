/**
 * =============================================================================
 * Module: Marketplace Order Routes
 * Component: /app/backend/routes/orders.js
 * Description: Order placement, cart checkout processing, and status tracking.
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

let Order;
try {
  Order = require('../models/Order');
} catch (_) {
  Order = null;
}

const productsRoute = require('./products');

// Pre-seeded in-memory orders so Admin Panel and User can see live order tracking immediately
const inMemoryOrders = [
  {
    _id: 'ord_1001',
    orderNumber: 'AGRI-784102',
    customerName: 'Mohammad Rahman',
    customerPhone: '01712345678',
    deliveryAddress: 'House 14, Road 3, Joydebpur, Gazipur Sadar',
    city: 'Gazipur',
    district: 'Gazipur',
    items: [
      {
        productId: 'prod_inst_1',
        name: 'Automatic Poultry Nipple Drinker Kit (10 Pack)',
        price: 1200,
        quantity: 2,
        unit: '10 pcs set',
        image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
        sellerName: 'AgriTech Poultry Equipments Ltd.'
      },
      {
        productId: 'prod_feed_1',
        name: 'Broiler Starter Crumbles 22% CP (50 kg Bag)',
        price: 3250,
        quantity: 1,
        unit: '50 kg sack',
        image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
        sellerName: 'Kazi Farms Feed Depot'
      }
    ],
    subtotal: 5650,
    deliveryFee: 0,
    totalAmount: 5650,
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
    orderStatus: 'confirmed',
    notes: 'Please call before arrival at farm entrance.',
    userId: '65fc20a1b900000000000001',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    _id: 'ord_1002',
    orderNumber: 'AGRI-784103',
    customerName: 'Kamal Hossain',
    customerPhone: '01819554433',
    deliveryAddress: 'Shukrabad Poultry Complex, Mirpur-1',
    city: 'Dhaka',
    district: 'Dhaka',
    items: [
      {
        productId: 'prod_med_1',
        name: 'Amprolium 20% Water Soluble Powder (Coccidiosis Treatment)',
        price: 650,
        quantity: 3,
        unit: '100g sachet',
        image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
        sellerName: 'Apex Vet Pharma Ltd.'
      }
    ],
    subtotal: 1950,
    deliveryFee: 60,
    totalAmount: 2010,
    paymentMethod: 'bkash',
    paymentStatus: 'paid',
    orderStatus: 'pending',
    notes: 'Urgent medical supply needed for flock.',
    userId: null,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

// Helper to generate readable 6-digit order number
const generateOrderNumber = () => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `AGRI-${rand}`;
};

// @route   POST /api/orders
// @desc    Place a new order with cart items
// @access  Public (Guest or Authenticated)
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      deliveryAddress,
      city,
      district,
      items,
      paymentMethod = 'cod',
      notes = '',
      userId = null
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, error: 'Full customer name is required.' });
    }
    if (!customerPhone || !customerPhone.trim()) {
      return res.status(400).json({ success: false, error: 'Valid contact phone number is required.' });
    }
    if (!deliveryAddress || !deliveryAddress.trim()) {
      return res.status(400).json({ success: false, error: 'Complete delivery address is required.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart must contain at least one item.' });
    }

    // Sanitize items and compute subtotal
    let subtotal = 0;
    const sanitizedItems = items.map(item => {
      const price = parseFloat(item.price) || 0;
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      subtotal += price * quantity;

      // Automatically decrement stock in in-memory products store
      if (productsRoute.inMemoryProducts) {
        const prod = productsRoute.inMemoryProducts.find(p => p._id === item.productId || p._id === item._id);
        if (prod && prod.stock !== undefined) {
          prod.stock = Math.max(0, (parseInt(prod.stock) || 0) - quantity);
        }
      }

      return {
        productId: item.productId || item._id || 'prod_unknown',
        name: item.name || 'AgriShop Product',
        category: item.category || 'General',
        price,
        quantity,
        unit: item.unit || 'unit',
        image: item.image || '',
        sellerName: item.sellerName || 'AgriMind Store'
      };
    });

    const deliveryFee = subtotal >= 2000 ? 0 : 60;
    const totalAmount = subtotal + deliveryFee;
    const orderNumber = generateOrderNumber();

    const newOrderData = {
      _id: `ord_${Date.now()}`,
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      city: (city || district || 'Bangladesh').trim(),
      district: (district || city || 'Bangladesh').trim(),
      items: sanitizedItems,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod: ['cod', 'bkash', 'nagad'].includes(paymentMethod) ? paymentMethod : 'cod',
      paymentStatus: paymentMethod === 'bkash' || paymentMethod === 'nagad' ? 'paid' : 'unpaid',
      orderStatus: 'pending',
      notes: notes ? notes.trim() : '',
      userId: userId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to in-memory store
    inMemoryOrders.unshift(newOrderData);

    // Save to MongoDB if available
    if (Order && mongoose.connection.readyState === 1) {
      try {
        const dbOrder = new Order({
          ...newOrderData,
          _id: new mongoose.Types.ObjectId()
        });
        await dbOrder.save();
      } catch (dbErr) {
        console.warn('MongoDB order persistence note:', dbErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully! We will contact you for delivery confirmation.',
      order: newOrderData
    });
  } catch (err) {
    console.error('Error placing order:', err);
    return res.status(500).json({ success: false, error: 'Server error placing order.' });
  }
});

// @route   GET /api/orders
// @desc    Get orders for customer or user
// @access  Public
router.get('/', (req, res) => {
  try {
    const { phone, userId } = req.query;
    let list = [...inMemoryOrders];

    if (phone) {
      list = list.filter(o => o.customerPhone === phone.trim());
    } else if (userId) {
      list = list.filter(o => String(o.userId) === String(userId));
    }

    return res.json({ success: true, count: list.length, orders: list });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// @route   GET /api/orders/track/:orderNumber
// @desc    Track order by human-readable order number
// @access  Public
router.get('/track/:orderNumber', (req, res) => {
  try {
    const num = req.params.orderNumber.toUpperCase();
    const order = inMemoryOrders.find(o => o.orderNumber.toUpperCase() === num);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }
    return res.json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Public
router.get('/:id', (req, res) => {
  try {
    const order = inMemoryOrders.find(o => o._id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }
    return res.json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.inMemoryOrders = inMemoryOrders;

module.exports = router;
