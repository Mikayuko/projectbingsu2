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

// เช็คสต๊อกใกล้หมด
stockSchema.statics.getLowStockItems = async function() {
  return this.find({
    $expr: { $lte: ['$quantity', '$reorderLevel'] }
  });
};

module.exports = mongoose.model('Stock', stockSchema);