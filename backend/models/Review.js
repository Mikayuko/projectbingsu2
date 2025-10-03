const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous reviews
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  customerName: {
    type: String,
    default: 'Anonymous'
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    minlength: [10, 'Review must be at least 10 characters'],
    maxlength: [500, 'Review cannot exceed 500 characters']
  },
  shavedIceFlavor: {
    type: String,
    enum: ['Strawberry', 'Thai Tea', 'Matcha', 'Milk', 'Green Tea']
  },
  toppings: [{
    type: String,
    enum: ['Apple', 'Cherry', 'Blueberry', 'Raspberry', 'Strawberry', 'Banana', 'Mango']
  }],
  isVerified: {
    type: Boolean,
    default: false // True if linked to an actual order
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  votedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVisible: {
    type: Boolean,
    default: true // Admin can hide inappropriate reviews
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate average rating (static method)
reviewSchema.statics.getAverageRating = async function() {
  const result = await this.aggregate([
    { $match: { isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (result.length > 0) {
    return {
      average: Math.round(result[0].averageRating * 10) / 10,
      total: result[0].totalReviews
    };
  }
  
  return { average: 0, total: 0 };
};

// Get rating distribution
reviewSchema.statics.getRatingDistribution = async function() {
  const distribution = await this.aggregate([
    { $match: { isVisible: true } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
  
  // Format into object with all ratings
  const result = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  distribution.forEach(item => {
    result[item._id] = item.count;
  });
  
  return result;
};

// Vote helpful
reviewSchema.methods.voteHelpful = async function(userId) {
  if (!this.votedBy.includes(userId)) {
    this.votedBy.push(userId);
    this.helpfulVotes += 1;
    return this.save();
  }
  throw new Error('User has already voted');
};

// Populate user info before sending
reviewSchema.pre(/^find/, function() {
  this.populate({
    path: 'user',
    select: 'fullName'
  }).populate({
    path: 'order',
    select: 'orderId shavedIce toppings'
  });
});

module.exports = mongoose.model('Review', reviewSchema);