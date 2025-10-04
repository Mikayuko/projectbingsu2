// src/pages/review/index.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api, isAuthenticated } from '@/utils/api';
import HeaderExclude from '../../components/HeaderExclude';

interface CustomerReview {
  _id?: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt?: string;
  shavedIceFlavor?: string;
  toppings?: string[];
}

export default function ReviewPage() {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canReview, setCanReview] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchReviews();
    checkIfCanReview();
  }, []);

  const fetchReviews = async () => {
    try {
      const result = await api.getReviews(1, 50);
      const formattedReviews = result.reviews.map((r: any) => ({
        _id: r._id,
        customerName: r.customerName || 'Anonymous',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        shavedIceFlavor: r.shavedIceFlavor,
        toppings: r.toppings
      }));
      setCustomerReviews(formattedReviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setCustomerReviews([]);
    }
  };

  const checkIfCanReview = async () => {
    try {
      if (!isAuthenticated()) {
        setCanReview(false);
        return;
      }

      const result = await api.getMyOrders();
      const completed = result.orders.filter((o: any) => o.status === 'Completed');
      
      if (completed.length > 0) {
        setCanReview(true);
        setCompletedOrders(completed);
      } else {
        setCanReview(false);
      }
    } catch (error) {
      console.error('Failed to check orders:', error);
      setCanReview(false);
    }
  };

  const handleSubmit = async () => {
    if (!canReview) {
      setError('You must complete an order before leaving a review');
      return;
    }

    if (!selectedOrder) {
      setError('Please select an order to review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (review.trim().length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    if (review.trim().length > 500) {
      setError('Review cannot exceed 500 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createReview({
        rating,
        comment: review.trim(),
        orderId: selectedOrder._id,
        shavedIceFlavor: selectedOrder.shavedIce.flavor,
        toppings: selectedOrder.toppings.map((t: any) => t.name)
      });

      setSubmitted(true);
      await fetchReviews();
      
      setTimeout(() => {
        setSubmitted(false);
        setRating(0);
        setReview('');
        setSelectedOrder(null);
        checkIfCanReview();
      }, 3000);

    } catch (error: any) {
      console.error('Failed to submit review:', error);
      setError(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const averageRating = customerReviews.length > 0
    ? customerReviews.reduce((sum, r) => sum + r.rating, 0) / customerReviews.length
    : 0;

  return (
    <div className="relative w-full min-h-screen bg-[#EBE6DE] px-4 md:px-10 lg:px-20 py-10">
      <HeaderExclude />

      {/* Section Title */}
      <div className="relative w-full mb-8 mt-4">
        <div className="absolute top-6 left-0 w-[280px] h-24 bg-[#EBE6DE] border-4 border-white shadow-[0_0_10px_rgba(0,0,0,0.25),_0_10px_30px_rgba(0,0,0,0.25)] rounded-r-[30px] flex items-center pl-6">
          <h2 className="text-white text-[32px] sm:text-[40px] md:text-[48px] font-['Iceland'] leading-none drop-shadow-md">
            Review page
          </h2>
        </div>
      </div>

      {/* Review Content */}
      <div className="w-full py-10 flex flex-col items-center">
        <h1 className="text-[48px] text-[#69806C] font-['Iceland'] mb-6 drop-shadow">
          Review
        </h1>

        {/* Current Rating */}
        <div className="mb-6 text-center text-[#543429] text-xl font-['Iceland']">
          Current Rating:{' '}
          <span className="text-yellow-500 text-3xl">
            {averageRating.toFixed(1)} ★
          </span>
          <span className="text-sm text-gray-500 ml-2">
            ({customerReviews.length} reviews)
          </span>
        </div>

        {/* Review Form */}
        {!submitted ? (
          <div className="bg-white/80 border border-[#69806C] rounded-xl shadow-xl p-6 w-full max-w-xl flex flex-col items-center gap-6">
            {/* Login/Order Required Warning */}
            {!isAuthenticated() && (
              <div className="w-full p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <p className="text-yellow-800 font-['Iceland'] text-center">
                  ⚠️ Please <Link href="/login" className="text-blue-600 underline">login</Link> and complete an order to leave a review
                </p>
              </div>
            )}

            {isAuthenticated() && !canReview && (
              <div className="w-full p-4 bg-orange-50 border-2 border-orange-400 rounded-lg">
                <p className="text-orange-800 font-['Iceland'] text-center mb-2">
                  📦 You need to complete an order first!
                </p>
                <Link href="/home">
                  <button className="w-full mt-2 px-4 py-2 bg-[#69806C] text-white rounded font-['Iceland'] hover:bg-[#5a6e5e]">
                    Order Now →
                  </button>
                </Link>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded font-['Iceland']">
                {error}
              </div>
            )}

            {/* Order Selector */}
            {canReview && completedOrders.length > 0 && (
              <div className="w-full">
                <label className="block text-gray-700 font-['Iceland'] mb-2">
                  Select Order to Review
                </label>
                <select
                  value={selectedOrder?._id || ''}
                  onChange={(e) => {
                    const order = completedOrders.find(o => o._id === e.target.value);
                    setSelectedOrder(order);
                    setError('');
                  }}
                  disabled={loading}
                  className="w-full p-3 border-2 border-[#69806C] rounded-lg font-['Iceland'] focus:outline-none focus:border-[#5a6e5e]"
                >
                  <option value="">Choose an order...</option>
                  {completedOrders.map((order) => (
                    <option key={order._id} value={order._id}>
                      {order.orderId} - {order.shavedIce.flavor} ({new Date(order.createdAt).toLocaleDateString('th-TH')})
                    </option>
                  ))}
                </select>
                
                {selectedOrder && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-['Iceland']">
                      🍧 <strong>{selectedOrder.shavedIce.flavor}</strong> - Size {selectedOrder.cupSize}
                    </p>
                    <p className="text-xs text-blue-700 font-['Iceland']">
                      Toppings: {selectedOrder.toppings.map((t: any) => t.name).join(', ') || 'None'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Rating Selector */}
            <div>
              <p className="text-center text-gray-700 font-['Iceland'] mb-2">
                Rate your experience
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setRating(num);
                      setError('');
                    }}
                    disabled={loading || !canReview}
                    className={`text-4xl ${
                      rating >= num ? 'text-yellow-400' : 'text-gray-400'
                    } hover:scale-110 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-gray-600 font-['Iceland'] mt-2">
                  You rated: {rating} star{rating > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Textarea */}
            <div className="w-full">
              <label className="block text-gray-700 font-['Iceland'] mb-2">
                Your Review (10-500 characters)
              </label>
              <textarea
                placeholder="Write your review here..."
                value={review}
                onChange={(e) => {
                  setReview(e.target.value);
                  setError('');
                }}
                disabled={loading || !canReview}
                rows={5}
                maxLength={500}
                className="w-full p-4 border border-[#69806C] rounded-md text-[#543429] font-['Iceland'] placeholder:text-[#A3A3A3] resize-none focus:outline-none focus:border-[#5a6e5e] shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-right text-sm text-gray-500 font-['Iceland'] mt-1">
                {review.length}/500 characters
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !canReview || rating === 0 || review.trim().length < 10 || !selectedOrder}
              className="w-48 h-14 bg-[#69806C] text-white text-2xl font-['Iceland'] rounded-lg shadow-md hover:bg-[#506256] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>

            {/* Info */}
            <p className="text-xs text-gray-500 text-center font-['Iceland']">
              Your feedback helps us improve our service!
            </p>
          </div>
        ) : (
          <div className="text-center mt-20 bg-white rounded-xl p-12 shadow-xl">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-[#69806C] text-3xl font-['Iceland'] mb-2">
              Thank you for your review!
            </h3>
            <p className="text-gray-600 font-['Iceland']">
              Your feedback has been submitted successfully
            </p>
          </div>
        )}

        {/* Customer Reviews */}
        <div className="w-full max-w-4xl mx-auto mt-12 mb-20">
          <h2 className="text-3xl text-[#69806C] font-['Iceland'] mb-6">Customer Reviews</h2>
          
          {customerReviews.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-lg">
              <div className="text-6xl mb-4">💭</div>
              <p className="text-gray-500 font-['Iceland'] text-lg">
                No reviews yet. Be the first to share your experience!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {customerReviews.map((r, i) => (
                <div
                  key={r._id || i}
                  className="bg-white border border-[#69806C] rounded-lg p-4 shadow-md hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-['Iceland'] text-[#543429] font-bold">
                        {r.customerName}
                      </span>
                      <span className="text-yellow-400 text-xl">
                        {'★'.repeat(r.rating)}
                        {'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    {r.createdAt && (
                      <span className="text-sm text-gray-500 font-['Iceland']">
                        {new Date(r.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    )}
                  </div>
                  
                  {/* ✅ แสดงว่าสั่งอะไรไป */}
                  {(r.shavedIceFlavor || r.toppings) && (
                    <div className="mb-2 p-2 bg-blue-50 rounded text-xs font-['Iceland']">
                      <span className="text-blue-800">
                        🍧 Ordered: <strong>{r.shavedIceFlavor}</strong>
                        {r.toppings && r.toppings.length > 0 && ` + ${r.toppings.join(', ')}`}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-[#543429] font-['Iceland'] text-base">
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}