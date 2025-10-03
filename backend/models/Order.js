// backend/models/Order.js - Fixed with better error handling

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    sparse: true // Allow null values for uniqueness
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  menuCode: {
    type: String,
    required: true
  },
  customerCode: {
    type: String,
    required: true,
    unique: true
  },
  cupSize: {
    type: String,
    enum: ['S', 'M', 'L'],
    required: true
  },
  shavedIce: {
    flavor: {
      type: String,
      enum: ['Strawberry', 'Thai Tea', 'Matcha', 'Milk', 'Green Tea'],
      required: true
    },
    points: {
      type: Number,
      default: 0
    }
  },
  toppings: [{
    name: {
      type: String,
      enum: ['Apple', 'Cherry', 'Blueberry', 'Raspberry', 'Strawberry', 'Banana', 'Mango'],
      required: true
    },
    points: {
      type: Number,
      default: 0
    }
  }],
  pricing: {
    basePrice: {
      type: Number,
      default: 60
    },
    sizePrice: {
      type: Number,
      default: 0
    },
    toppingsPrice: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Refunded'],
    default: 'Unpaid'
  },
  specialInstructions: {
    type: String,
    maxlength: 200,
    default: ''
  },
  timestamps: {
    ordered: {
      type: Date,
      default: Date.now
    },
    prepared: Date,
    ready: Date,
    completed: Date
  },
  isFreeDrink: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate unique order ID before saving
orderSchema.pre('save', async function(next) {
  try {
    if (!this.orderId) {
      // Generate orderId based on timestamp and random number to ensure uniqueness
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substr(2, 3).toUpperCase();
      this.orderId = `ORD${timestamp}${random}`;
      
      console.log('Generated orderId:', this.orderId);
    }
    next();
  } catch (error) {
    console.error('Error in Order pre-save hook:', error);
    next(error);
  }
});

// Calculate total price method
orderSchema.methods.calculateTotal = function() {
  try {
    let total = this.pricing.basePrice || 60;
    
    // Size pricing
    const sizePrices = { S: 0, M: 10, L: 20 };
    const sizePrice = sizePrices[this.cupSize] || 0;
    total += sizePrice;
    
    // Toppings pricing (10 baht per topping)
    const toppingsPrice = (this.toppings?.length || 0) * 10;
    total += toppingsPrice;
    
    // Update pricing object
    this.pricing.sizePrice = sizePrice;
    this.pricing.toppingsPrice = toppingsPrice;
    this.pricing.total = total;
    
    // Apply free drink if applicable
    if (this.isFreeDrink) {
      this.pricing.total = 0;
    }
    
    console.log('Calculated total:', this.pricing.total);
    return this.pricing.total;
  } catch (error) {
    console.error('Error calculating total:', error);
    return this.pricing.total || 60;
  }
};

// Update status with timestamp
orderSchema.methods.updateStatus = function(newStatus) {
  try {
    this.status = newStatus;
    
    const statusTimestamps = {
      'Preparing': 'prepared',
      'Ready': 'ready',
      'Completed': 'completed'
    };
    
    if (statusTimestamps[newStatus]) {
      this.timestamps[statusTimestamps[newStatus]] = new Date();
    }
    
    console.log('Updated status to:', newStatus);
    return this.save();
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
};

// Index for faster queries
orderSchema.index({ customerCode: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);