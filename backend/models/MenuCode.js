const mongoose = require('mongoose');

const menuCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    length: 5
  },
  cupSize: {
    type: String,
    enum: ['S', 'M', 'L'],
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  maxUsage: {
    type: Number,
    default: 5
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedBy: [{
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    usedAt: Date
  }],
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate random code with uniqueness check
menuCodeSchema.statics.generateCode = async function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    const existing = await this.findOne({ code });
    if (!existing) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Unable to generate unique code after maximum attempts');
};

// Create new menu code
menuCodeSchema.statics.createCode = async function(cupSize, createdBy) {
  let code = await this.generateCode();
  
  const menuCode = new this({
    code,
    cupSize,
    createdBy
  });
  
  return menuCode.save();
};

// Validate and use code - allow multiple orders
menuCodeSchema.statics.validateAndUse = async function(code, orderId) {
  const menuCode = await this.findOne({ 
    code: code.toUpperCase()
  });
  
  if (!menuCode) {
    throw new Error('Invalid code');
  }
  
  if (menuCode.expiresAt < new Date()) {
    throw new Error('Code has expired');
  }
  
  if (menuCode.usageCount >= menuCode.maxUsage) {
    throw new Error('Code usage limit reached (maximum 5 orders per code)');
  }
  
  menuCode.usageCount += 1;
  menuCode.usedBy.push({
    order: orderId,
    usedAt: new Date()
  });
  
  await menuCode.save();
  return menuCode;
};

// Check if code can still be used
menuCodeSchema.methods.canBeUsed = function() {
  if (this.expiresAt < new Date()) {
    return { valid: false, reason: 'Code has expired' };
  }
  
  if (this.usageCount >= this.maxUsage) {
    return { valid: false, reason: 'Code usage limit reached' };
  }
  
  return { 
    valid: true, 
    remainingUses: this.maxUsage - this.usageCount 
  };
};

// Clean up expired codes
menuCodeSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    usageCount: 0,
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount;
};

module.exports = mongoose.model('MenuCode', menuCodeSchema);