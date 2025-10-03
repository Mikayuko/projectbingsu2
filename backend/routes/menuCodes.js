const express = require('express');
const { body, validationResult } = require('express-validator');
const MenuCode = require('../models/MenuCode');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/menu-codes/generate (Admin only)
router.post('/generate', authenticate, isAdmin, [
  body('cupSize').isIn(['S', 'M', 'L']).withMessage('Invalid cup size')
], async (req, res) => {
  try {
    console.log('🎫 Generating menu code for size:', req.body.cupSize);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { cupSize } = req.body;
    
    const menuCode = await MenuCode.createCode(cupSize, req.user._id);
    
    console.log('✅ Menu code generated:', menuCode.code);
    
    res.status(201).json({
      message: 'Menu code generated successfully',
      code: menuCode.code,
      cupSize: menuCode.cupSize,
      maxUsage: menuCode.maxUsage,
      expiresAt: menuCode.expiresAt
    });
  } catch (error) {
    console.error('❌ Menu code generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate menu code',
      error: error.message 
    });
  }
});

// POST /api/menu-codes/validate
router.post('/validate', [
  body('code').notEmpty().isLength({ min: 5, max: 5 })
], async (req, res) => {
  try {
    const { code } = req.body;
    console.log('🔍 Validating menu code:', code);
    
    const menuCode = await MenuCode.findOne({
      code: code.toUpperCase()
    });
    
    console.log('📋 Code lookup result:', menuCode ? 'Found' : 'Not found');
    
    if (!menuCode) {
      console.log('❌ Code not found in database');
      return res.status(400).json({ 
        valid: false,
        message: 'Invalid code' 
      });
    }
    
    const usageCheck = menuCode.canBeUsed();
    
    if (!usageCheck.valid) {
      console.log('❌ Code cannot be used:', usageCheck.reason);
      return res.status(400).json({ 
        valid: false,
        message: usageCheck.reason 
      });
    }
    
    console.log('✅ Code is valid. Cup size:', menuCode.cupSize);
    console.log(`📊 Remaining uses: ${usageCheck.remainingUses}/${menuCode.maxUsage}`);
    
    res.json({
      valid: true,
      cupSize: menuCode.cupSize,
      remainingUses: usageCheck.remainingUses,
      maxUsage: menuCode.maxUsage,
      message: `Code is valid. ${usageCheck.remainingUses} uses remaining.`
    });
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({ 
      message: 'Failed to validate code',
      error: error.message 
    });
  }
});

// GET /api/menu-codes/admin/all (Admin only)
router.get('/admin/all', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('📋 Admin fetching all menu codes');
    
    const { status, cupSize } = req.query;
    const filter = {};
    
    if (status === 'used') {
      filter.usageCount = { $gte: 1 };
    } else if (status === 'unused') {
      filter.usageCount = 0;
    } else if (status === 'expired') {
      filter.usageCount = { $lt: 5 };
      filter.expiresAt = { $lt: new Date() };
    } else if (status === 'full') {
      filter.usageCount = { $gte: 5 };
    }
    
    if (cupSize) {
      filter.cupSize = cupSize;
    }
    
    const codes = await MenuCode.find(filter)
      .populate('createdBy', 'fullName')
      .populate('usedBy.order')
      .sort('-createdAt')
      .limit(100);
    
    console.log(`✅ Found ${codes.length} codes`);
    res.json({ codes });
  } catch (error) {
    console.error('❌ Error fetching codes:', error);
    res.status(500).json({ 
      message: 'Failed to fetch menu codes',
      error: error.message 
    });
  }
});

// DELETE /api/menu-codes/admin/cleanup (Admin only)
router.delete('/admin/cleanup', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('🧹 Cleaning up expired codes');
    
    const deletedCount = await MenuCode.cleanupExpired();
    
    console.log(`✅ Deleted ${deletedCount} expired codes`);
    res.json({
      message: `Cleaned up ${deletedCount} expired codes`,
      deletedCount
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ 
      message: 'Failed to cleanup codes',
      error: error.message 
    });
  }
});

// GET /api/menu-codes/admin/stats (Admin only)
router.get('/admin/stats', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching menu code statistics');
    
    const stats = await MenuCode.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          partiallyUsed: [
            { $match: { usageCount: { $gte: 1, $lt: 5 } } },
            { $count: 'count' }
          ],
          fullyUsed: [
            { $match: { usageCount: { $gte: 5 } } },
            { $count: 'count' }
          ],
          unused: [
            { $match: { usageCount: 0 } },
            { $count: 'count' }
          ],
          expired: [
            { 
              $match: { 
                usageCount: { $lt: 5 },
                expiresAt: { $lt: new Date() }
              } 
            },
            { $count: 'count' }
          ],
          byCupSize: [
            { $group: { 
              _id: '$cupSize',
              count: { $sum: 1 },
              totalUsage: { $sum: '$usageCount' }
            }}
          ]
        }
      }
    ]);
    
    const result = {
      total: stats[0].total[0]?.count || 0,
      partiallyUsed: stats[0].partiallyUsed[0]?.count || 0,
      fullyUsed: stats[0].fullyUsed[0]?.count || 0,
      unused: stats[0].unused[0]?.count || 0,
      expired: stats[0].expired[0]?.count || 0,
      byCupSize: stats[0].byCupSize
    };
    
    console.log('✅ Statistics:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics',
      error: error.message 
    });
  }
});

module.exports = router;