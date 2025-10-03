const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const MenuCode = require('../models/MenuCode');
const User = require('../models/User');
const { authenticate, optionalAuth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders/create
router.post('/create', optionalAuth, [
  body('menuCode').notEmpty().isLength({ min: 5, max: 5 }),
  body('shavedIce').isObject(),
  body('toppings').isArray(),
  body('specialInstructions').optional().isLength({ max: 200 })
], async (req, res) => {
  try {
    console.log('📝 Creating order with data:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    
    const { menuCode, shavedIce, toppings, specialInstructions } = req.body;
    
    // Validate menu code
    let codeDoc;
    try {
      codeDoc = await MenuCode.findOne({ 
        code: menuCode.toUpperCase()
      });
      
      console.log('🔍 Menu code lookup result:', codeDoc);
    } catch (dbError) {
      console.error('❌ Database error looking up menu code:', dbError);
      return res.status(500).json({ 
        message: 'Database error',
        error: dbError.message 
      });
    }
    
    if (!codeDoc) {
      console.log('❌ Menu code not found:', menuCode);
      return res.status(400).json({ 
        message: 'Invalid menu code' 
      });
    }
    
    // Check if expired
    if (codeDoc.expiresAt < new Date()) {
      console.log('❌ Menu code expired:', menuCode);
      return res.status(400).json({ 
        message: 'Menu code has expired' 
      });
    }
    
    console.log('✅ Menu code is valid:', menuCode);
    
    // Generate customer code
    const customerCode = `#${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    console.log('🎫 Generated customer code:', customerCode);
    
    // Create order
    const order = new Order({
      customerId: req.user?._id,
      menuCode: menuCode.toUpperCase(),
      customerCode,
      cupSize: codeDoc.cupSize,
      shavedIce,
      toppings,
      specialInstructions,
      pricing: {
        basePrice: 60,
      },
      paymentStatus: 'Paid' // ถือว่าจ่ายเงินเสร็จทันที
    });
    
    // Calculate total
    order.calculateTotal();
    console.log('💰 Calculated total:', order.pricing.total);
    
    // Check if user gets free drink
    let earnedFreeDrink = false;
    if (req.user) {
      try {
        const user = await User.findById(req.user._id);
        if (user) {
          earnedFreeDrink = user.addLoyaltyStamp();
          
          if (earnedFreeDrink) {
            order.isFreeDrink = true;
            order.calculateTotal();
            console.log('🎉 User earned free drink!');
          }
          
          user.orderHistory.push(order._id);
          user.loyaltyPoints += Math.floor(order.pricing.total / 10);
          await user.save();
          console.log('✅ User updated with loyalty points');
        }
      } catch (userError) {
        console.error('⚠️ Error updating user, but continuing:', userError);
      }
    }
    
    // Save order
    try {
      await order.save();
      console.log('✅ Order saved successfully:', order.orderId);
    } catch (saveError) {
      console.error('❌ Error saving order:', saveError);
      return res.status(500).json({ 
        message: 'Failed to save order',
        error: saveError.message 
      });
    }
    
    // ✅ หมดอายุโค้ดทันทีหลังสั่งเสร็จและจ่ายเงินแล้ว
    try {
      await MenuCode.expireCode(menuCode);
      console.log('✅ Menu code expired after order completed');
    } catch (codeError) {
      console.error('⚠️ Error expiring code:', codeError);
    }
    
    res.status(201).json({
      message: 'Order created successfully',
      order,
      customerCode,
      earnedFreeDrink
    });
    
  } catch (error) {
    console.error('❌ Unexpected error in order creation:', error);
    res.status(500).json({ 
      message: 'Failed to create order',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/orders/track/:customerCode
router.get('/track/:customerCode', async (req, res) => {
  try {
    let code = req.params.customerCode.toUpperCase();
    if (code.startsWith('#')) code = code.slice(1);

    console.log('🔍 Tracking order:', code);

    const order = await Order.findOne({ customerCode: new RegExp(`^#?${code}$`, 'i') });

    if (!order) {
      console.log('❌ Order not found:', code);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('✅ Order found:', order.orderId);
    res.json({ order });
  } catch (error) {
    console.error('❌ Error tracking order:', error);
    res.status(500).json({ 
      message: 'Failed to track order',
      error: error.message 
    });
  }
});

// GET /api/orders/my-orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    console.log('📋 Fetching orders for user:', req.user._id);
    
    const orders = await Order.find({ 
      customerId: req.user._id 
    }).sort('-createdAt');
    
    console.log(`✅ Found ${orders.length} orders`);
    res.json({ orders });
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({ 
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
});

// Admin Routes

// GET /api/orders/admin/all
router.get('/admin/all', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('📋 Admin fetching all orders');
    
    const { status, date } = req.query;
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.createdAt = { $gte: startDate, $lt: endDate };
    }
    
    const orders = await Order.find(filter)
      .populate('customerId', 'fullName email')
      .sort('-createdAt');
    
    console.log(`✅ Found ${orders.length} orders`);
    res.json({ orders });
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({ 
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
});

// PUT /api/orders/admin/:orderId/status
router.put('/admin/:orderId/status', authenticate, isAdmin, [
  body('status').isIn(['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'])
], async (req, res) => {
  try {
    console.log('🔄 Updating order status:', req.params.orderId, '->', req.body.status);
    
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      console.log('❌ Order not found:', req.params.orderId);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    await order.updateStatus(status);
    console.log('✅ Order status updated');
    
    res.json({ 
      message: 'Order status updated',
      order 
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ 
      message: 'Failed to update order status',
      error: error.message 
    });
  }
});

// GET /api/orders/admin/stats
router.get('/admin/stats', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching order statistics');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = await Order.aggregate([
      {
        $facet: {
          todayOrders: [
            { $match: { createdAt: { $gte: today } } },
            { $count: 'count' }
          ],
          todayRevenue: [
            { 
              $match: { 
                createdAt: { $gte: today },
                paymentStatus: 'Paid'
              } 
            },
            { $group: { _id: null, total: { $sum: '$pricing.total' } } }
          ],
          pendingOrders: [
            { $match: { status: 'Pending' } },
            { $count: 'count' }
          ],
          popularFlavors: [
            { $group: { 
              _id: '$shavedIce.flavor',
              count: { $sum: 1 }
            }},
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);
    
    const result = {
      todayOrders: stats[0].todayOrders[0]?.count || 0,
      todayRevenue: stats[0].todayRevenue[0]?.total || 0,
      pendingOrders: stats[0].pendingOrders[0]?.count || 0,
      popularFlavors: stats[0].popularFlavors
    };
    
    console.log('✅ Statistics calculated:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics',
      error: error.message 
    });
  }
});

module.exports = router;