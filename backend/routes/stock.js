// backend/routes/stock.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const Stock = require('../models/Stock');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/stock - ดูสต๊อกทั้งหมด
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const stocks = await Stock.find().sort('itemType name');
    
    const flavors = stocks.filter(s => s.itemType === 'flavor');
    const toppings = stocks.filter(s => s.itemType === 'topping');
    const lowStock = await Stock.getLowStockItems();
    
    res.json({
      flavors,
      toppings,
      lowStock,
      total: stocks.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stock', error: error.message });
  }
});

// POST /api/stock - สร้าง/อัพเดทสต๊อก
router.post('/', authenticate, isAdmin, [
  body('itemType').isIn(['flavor', 'topping']),
  body('name').notEmpty(),
  body('quantity').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { itemType, name, quantity, reorderLevel, isActive } = req.body;
    
    const stock = await Stock.setStock(itemType, name, quantity, reorderLevel, isActive);
    
    res.json({
      message: 'Stock updated successfully',
      stock
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update stock', error: error.message });
  }
});

// PUT /api/stock/:id/adjust - ปรับสต๊อก (เพิ่ม/ลด)
router.put('/:id/adjust', authenticate, isAdmin, [
  body('adjustment').isInt()
], async (req, res) => {
  try {
    const { adjustment } = req.body;
    const stock = await Stock.findById(req.params.id);
    
    if (!stock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    
    stock.quantity += adjustment;
    
    if (stock.quantity < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }
    
    if (adjustment > 0) {
      stock.lastRestocked = new Date();
    }
    
    await stock.save();
    
    res.json({
      message: `Stock ${adjustment > 0 ? 'increased' : 'decreased'} successfully`,
      stock
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to adjust stock', error: error.message });
  }
});

// PUT /api/stock/:id - อัพเดทรายละเอียดสต๊อก
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { quantity, reorderLevel, isActive } = req.body;
    const stock = await Stock.findById(req.params.id);
    
    if (!stock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    
    if (quantity !== undefined) stock.quantity = quantity;
    if (reorderLevel !== undefined) stock.reorderLevel = reorderLevel;
    if (isActive !== undefined) stock.isActive = isActive;
    
    await stock.save();
    
    res.json({
      message: 'Stock updated successfully',
      stock
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update stock', error: error.message });
  }
});

// GET /api/stock/low - ดูสินค้าใกล้หมด
router.get('/low', authenticate, isAdmin, async (req, res) => {
  try {
    const lowStock = await Stock.getLowStockItems();
    res.json({ lowStock });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch low stock', error: error.message });
  }
});

// GET /api/stock/available/:itemType - ดูสินค้าที่พร้อมขาย
router.get('/available/:itemType', async (req, res) => {
  try {
    const { itemType } = req.params;
    
    if (!['flavor', 'topping'].includes(itemType)) {
      return res.status(400).json({ message: 'Invalid item type' });
    }
    
    const items = await Stock.getAvailableItems(itemType);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch available items', error: error.message });
  }
});

// POST /api/stock/check-availability - เช็คว่าสินค้ายังมีหรือไม่
router.post('/check-availability', [
  body('itemType').isIn(['flavor', 'topping']),
  body('name').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { itemType, name } = req.body;
    const isAvailable = await Stock.isAvailable(itemType, name);
    
    res.json({ 
      available: isAvailable,
      itemType,
      name
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check availability', error: error.message });
  }
});

// DELETE /api/stock/:id - ลบสต๊อก
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const stock = await Stock.findByIdAndDelete(req.params.id);
    
    if (!stock) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    
    res.json({ message: 'Stock item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete stock', error: error.message });
  }
});

// POST /api/stock/initialize - สร้างสต๊อกเริ่มต้น (สำหรับ setup ครั้งแรก)
router.post('/initialize', authenticate, isAdmin, async (req, res) => {
  try {
    const defaultStock = [
      // Flavors
      { itemType: 'flavor', name: 'Strawberry', quantity: 100, reorderLevel: 20 },
      { itemType: 'flavor', name: 'Thai Tea', quantity: 100, reorderLevel: 20 },
      { itemType: 'flavor', name: 'Matcha', quantity: 100, reorderLevel: 20 },
      { itemType: 'flavor', name: 'Milk', quantity: 100, reorderLevel: 20 },
      { itemType: 'flavor', name: 'Green Tea', quantity: 100, reorderLevel: 20 },
      // Toppings
      { itemType: 'topping', name: 'Apple', quantity: 100, reorderLevel: 20 },
      { itemType: 'topping', name: 'Cherry', quantity: 100, reorderLevel: 20 },
      { itemType: 'topping', name: 'Blueberry', quantity: 100, reorderLevel: 20 },
      { itemType: 'topping', name: 'Raspberry', quantity: 100, reorderLevel: 20 },
      { itemType: 'topping', name: 'Strawberry', quantity: 100, reorderLevel: 20 },
      { itemType: 'topping', name: 'Banana', quantity: 100, reorderLevel: 20 },
      { itemType: 'topping', name: 'Mango', quantity: 100, reorderLevel: 20 },
    ];
    
    const results = [];
    for (const item of defaultStock) {
      const existing = await Stock.findOne({ 
        itemType: item.itemType, 
        name: item.name 
      });
      
      if (!existing) {
        const stock = await Stock.create(item);
        results.push(stock);
      }
    }
    
    res.json({
      message: `Initialized ${results.length} stock items`,
      created: results.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to initialize stock', error: error.message });
  }
});

module.exports = router;