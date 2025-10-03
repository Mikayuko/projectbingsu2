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
    
    const { itemType, name, quantity, reorderLevel } = req.body;
    
    let stock = await Stock.findOne({ itemType, name });
    
    if (stock) {
      stock.quantity = quantity;
      if (reorderLevel !== undefined) stock.reorderLevel = reorderLevel;
      stock.lastRestocked = new Date();
      await stock.save();
    } else {
      stock = await Stock.create({
        itemType,
        name,
        quantity,
        reorderLevel: reorderLevel || 20
      });
    }
    
    res.json({
      message: 'Stock updated successfully',
      stock
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update stock', error: error.message });
  }
});

// PUT /api/stock/:id/adjust - ปรับสต๊อก
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

// GET /api/stock/low - ดูสินค้าใกล้หมด
router.get('/low', authenticate, isAdmin, async (req, res) => {
  try {
    const lowStock = await Stock.getLowStockItems();
    res.json({ lowStock });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch low stock', error: error.message });
  }
});

// DELETE /api/stock/:id
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

module.exports = router;