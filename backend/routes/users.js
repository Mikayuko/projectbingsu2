const express = require('express');
const User = require('../models/User');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/admin/all
router.get('/admin/all', authenticate, isAdmin, async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    const filter = {};
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter)
      .select('-password')
      .populate('orderHistory')
      .sort('-createdAt');
    
    const usersWithStats = users.map(user => ({
      ...user.toObject(),
      orderCount: user.orderHistory?.length || 0
    }));
    
    res.json({ users: usersWithStats });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// PUT /api/users/admin/:userId
router.put('/admin/:userId', authenticate, isAdmin, async (req, res) => {
  try {
    const { fullName, email, role, loyaltyPoints, loyaltyCard, isActive } = req.body;
    const updates = {};
    
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (loyaltyPoints !== undefined) updates.loyaltyPoints = loyaltyPoints;
    if (loyaltyCard) updates.loyaltyCard = loyaltyCard;
    if (isActive !== undefined) updates.isActive = isActive;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// DELETE /api/users/admin/:userId
router.delete('/admin/:userId', authenticate, isAdmin, async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// POST /api/users/admin/:userId/toggle-status
router.post('/admin/:userId/toggle-status', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: { ...user.toObject(), password: undefined }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

module.exports = router;