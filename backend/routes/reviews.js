const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { authenticate, optionalAuth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews/create
router.post('/create', optionalAuth, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').isLength({ min: 10, max: 500 }),
  body('orderId').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { rating, comment, orderId, shavedIceFlavor, toppings } = req.body;
    
    const reviewData = {
      rating,
      comment,
      shavedIceFlavor,
      toppings
    };
    
    // If user is logged in
    if (req.user) {
      reviewData.user = req.user._id;
      reviewData.customerName = req.user.fullName;
    }
    
    // If order ID is provided, verify it
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Verify order belongs to user (if logged in)
      if (req.user && order.customerId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Cannot review order that doesn\'t belong to you' });
      }
      
      reviewData.order = orderId;
      reviewData.isVerified = true;
      reviewData.shavedIceFlavor = order.shavedIce.flavor;
      reviewData.toppings = order.toppings.map(t => t.name);
    }
    
    const review = new Review(reviewData);
    await review.save();
    
    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ message: 'Failed to submit review' });
  }
});

// GET /api/reviews
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    const reviews = await Review.find({ isVisible: true })
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments({ isVisible: true });
    
    // Get statistics
    const stats = await Review.getAverageRating();
    const distribution = await Review.getRatingDistribution();
    
    res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total,
      stats,
      distribution
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews/:reviewId/helpful
router.post('/:reviewId/helpful', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    await review.voteHelpful(req.user._id);
    
    res.json({ 
      message: 'Vote recorded',
      helpfulVotes: review.helpfulVotes 
    });
  } catch (error) {
    if (error.message === 'User has already voted') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to record vote' });
  }
});

// Admin Routes

// GET /api/reviews/admin/all
router.get('/admin/all', authenticate, isAdmin, async (req, res) => {
  try {
    const { isVisible, isVerified } = req.query;
    const filter = {};
    
    if (isVisible !== undefined) {
      filter.isVisible = isVisible === 'true';
    }
    
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }
    
    const reviews = await Review.find(filter)
      .sort('-createdAt');
    
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// PUT /api/reviews/admin/:reviewId/visibility
router.put('/admin/:reviewId/visibility', authenticate, isAdmin, [
  body('isVisible').isBoolean()
], async (req, res) => {
  try {
    const { isVisible } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { isVisible },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json({ 
      message: `Review ${isVisible ? 'shown' : 'hidden'}`,
      review 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update review visibility' });
  }
});

// DELETE /api/reviews/admin/:reviewId
router.delete('/admin/:reviewId', authenticate, isAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

module.exports = router;