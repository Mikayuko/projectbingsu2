// backend/models/Stock.js
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['flavor', 'topping'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 100
  },
  unit: {
    type: String,
    default: 'cups'
  },
  reorderLevel: {
    type: Number,
    default: 20
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ลดสต๊อก
stockSchema.statics.reduceStock = async function(itemType, name, amount = 1) {
  const stock = await this.findOne({ itemType, name });
  
  if (!stock) {
    console.warn(`Stock not found for ${itemType}: ${name}`);
    return null;
  }
  
  if (stock.quantity < amount) {
    throw new Error(`Insufficient stock for ${name}. Available: ${stock.quantity}`);
  }
  
  stock.quantity -= amount;
  await stock.save();
  
  return stock;
};

// เพิ่มสต๊อก
stockSchema.statics.addStock = async function(itemType, name, amount) {
  const stock = await this.findOne({ itemType, name });
  
  if (!stock) {
    return this.create({
      itemType,
      name,
      quantity: amount,
      lastRestocked: new Date()
    });
  }
  
  stock.quantity += amount;
  stock.lastRestocked = new Date();
  await stock.save();
  
  return stock;
};

// ✅ ตั้งค่าสต๊อก (สำหรับ admin ปรับจำนวน)
stockSchema.statics.setStock = async function(itemType, name, quantity, reorderLevel, isActive) {
  let stock = await this.findOne({ itemType, name });
  
  if (!stock) {
    stock = new this({
      itemType,
      name,
      quantity,
      reorderLevel: reorderLevel || 20,
      isActive: isActive !== undefined ? isActive : true
    });
  } else {
    stock.quantity = quantity;
    if (reorderLevel !== undefined) stock.reorderLevel = reorderLevel;
    if (isActive !== undefined) stock.isActive = isActive;
    stock.lastRestocked = new Date();
  }
  
  await stock.save();
  return stock;
};

// เช็คสต๊อกใกล้หมด
stockSchema.statics.getLowStockItems = async function() {
  return this.find({
    $expr: { $lt: ['$quantity', '$reorderLevel'] }
  });
};

// ✅ เช็คว่าสินค้ายังมีอยู่และ active หรือไม่
stockSchema.statics.isAvailable = async function(itemType, name) {
  const stock = await this.findOne({ itemType, name });
  return stock && stock.isActive && stock.quantity > 0;
};

// ✅ ดึงรายการสินค้าที่พร้อมขาย
stockSchema.statics.getAvailableItems = async function(itemType) {
  return this.find({
    itemType,
    isActive: true,
    quantity: { $gt: 0 }
  }).sort('name');
};

module.exports = mongoose.model('Stock', stockSchema);