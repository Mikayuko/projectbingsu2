// src/pages/home.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import HeaderExclude from '../components/HeaderExclude';
import { api } from '@/utils/api';

interface PopularItem {
  flavor: string;
  count: number;
  image: string;
}

interface RecentReview {
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const [menuCode, setMenuCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);

  useEffect(() => {
    fetchPopularItems();
    fetchRecentReviews();
  }, []);

  const fetchPopularItems = async () => {
    try {
      const result = await api.getOrderStats();
      const flavors = result.popularFlavors || [];
      
      const flavorImages: { [key: string]: string } = {
        'Strawberry': '/images/strawberry-ice.png',
        'Thai Tea': '/images/thai-tea-ice.png',
        'Matcha': '/images/matcha-ice.png',
        'Milk': '/images/strawberry-ice.png',
        'Green Tea': '/images/matcha-ice.png',
      };

      const items = flavors.slice(0, 3).map((f: any) => ({
        flavor: f._id,
        count: f.count,
        image: flavorImages[f._id] || '/images/strawberry-ice.png'
      }));

      setPopularItems(items);
    } catch (error) {
      console.error('Failed to fetch popular items:', error);
      setPopularItems([
        { flavor: 'Strawberry', count: 25, image: '/images/strawberry-ice.png' },
        { flavor: 'Matcha', count: 20, image: '/images/matcha-ice.png' },
        { flavor: 'Thai Tea', count: 18, image: '/images/thai-tea-ice.png' },
      ]);
    }
  };

  const fetchRecentReviews = async () => {
    try {
      const result = await api.getReviews(1, 3);
      setRecentReviews(result.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setRecentReviews([]);
    }
  };

  const handleConfirm = () => {
    if (menuCode.trim().length !== 5) {
      setError('Please enter a valid 5-character menu code');
      return;
    }
    
    router.push(`/menu?code=${menuCode.toUpperCase()}`);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#EBE6DE]">
      {/* Header with Navigation */}
      <div className="px-4 md:px-10 lg:px-20 py-10">
        <HeaderExclude />
      </div>

      {/* Hero Section with Promotion */}
      <div className="w-full bg-gradient-to-r from-[#69806C] to-[#947E5A] py-16 px-4 mb-12">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl text-white font-['Iceland'] mb-4 drop-shadow-lg">
            Welcome to Bingsu Paradise! 🍧
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-['Iceland'] mb-6">
            Cool down with our signature Korean shaved ice
          </p>
          
          {/* Special Offer Badge */}
          <div className="inline-block bg-yellow-400 text-[#543429] px-6 py-3 rounded-full font-['Iceland'] text-xl font-bold shadow-lg animate-pulse">
            🎉 Buy 9, Get 1 FREE! 🎉
          </div>
        </div>
      </div>

      {/* Popular Items Section */}
      {popularItems.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 mb-16">
          <h2 className="text-4xl text-[#69806C] font-['Iceland'] mb-8 text-center drop-shadow">
            🔥 Popular Flavors Today
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {popularItems.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition duration-300">
                <div className="relative h-64">
                  <img 
                    src={item.image} 
                    alt={item.flavor}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-['Iceland'] text-sm">
                    #{idx + 1} Best Seller
                  </div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-2xl font-['Iceland'] text-[#543429] mb-2">
                    {item.flavor} Bingsu
                  </h3>
                  <p className="text-gray-600 font-['Iceland']">
                    🔥 {item.count} orders today!
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Now Section */}
      <div className="w-full bg-[#947E5A] py-16 px-4 mb-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl text-white font-['Iceland'] mb-4 text-center drop-shadow">
            Start Your Order
          </h2>
          <p className="text-white/90 font-['Iceland'] text-lg mb-8 text-center">
            Enter your menu code to begin
          </p>

          {error && (
            <div className="max-w-xl mx-auto mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded font-['Iceland']">
              {error}
            </div>
          )}

          {/* Enter Menu Code Field */}
          <div className="max-w-xl mx-auto flex flex-col gap-4">
            <div className="bg-[#EBE6DE] border-2 border-white shadow-2xl rounded-xl flex justify-center items-center px-6 py-4">
              <input
                type="text"
                placeholder="Enter Menu Code"
                value={menuCode}
                onChange={(e) => {
                  setMenuCode(e.target.value.toUpperCase());
                  setError('');
                }}
                maxLength={5}
                onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
                className="w-full bg-transparent outline-none text-3xl font-['Iceland'] text-[#69806C] placeholder-[#69806C]/50 text-center tracking-widest"
              />
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={loading || menuCode.length !== 5}
              className="w-full py-4 bg-[#EBE6DE] border-2 border-white shadow-2xl rounded-xl text-[#69806C] text-3xl font-['Iceland'] hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Confirm & Order Now'}
            </button>

            {/* Demo Codes Info */}
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <p className="text-white/90 font-['Iceland'] text-sm mb-2">
                💡 Demo Codes for Testing:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['TEST1', 'TEST2', 'TEST3', 'DEMO1', 'DEMO2'].map(code => (
                  <button
                    key={code}
                    onClick={() => setMenuCode(code)}
                    className="px-3 py-1 bg-white/30 hover:bg-white/50 rounded font-['Iceland'] text-white text-sm transition"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reviews Section */}
      {recentReviews.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 mb-16">
          <h2 className="text-4xl text-[#69806C] font-['Iceland'] mb-8 text-center drop-shadow">
            ⭐ What Our Customers Say
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentReviews.map((review, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-['Iceland'] text-lg text-[#543429] font-bold">
                    {review.customerName}
                  </span>
                  <span className="text-yellow-400 text-xl">
                    {'★'.repeat(review.rating)}
                  </span>
                </div>
                <p className="text-gray-700 font-['Iceland'] text-sm mb-3">
                  "{review.comment}"
                </p>
                <p className="text-gray-400 font-['Iceland'] text-xs">
                  {new Date(review.createdAt).toLocaleDateString('th-TH')}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/review">
              <button className="px-6 py-3 bg-[#947E5A] text-white font-['Iceland'] text-lg rounded-lg hover:bg-[#7a6648] transition shadow-md">
                See All Reviews →
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* ✅ Gallery Preview - รูปตรงกลาง + เพิ่ม Toppings */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <h2 className="text-4xl text-[#69806C] font-['Iceland'] mb-8 text-center drop-shadow">
          📸 Our Delicious Creations
        </h2>
        
        {/* Flavors */}
        <div className="mb-8">
          <h3 className="text-2xl text-[#947E5A] font-['Iceland'] mb-4 text-center">🍧 Signature Flavors</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { img: '/images/strawberry-ice.png', name: 'Strawberry' },
              { img: '/images/thai-tea-ice.png', name: 'Thai Tea' },
              { img: '/images/matcha-ice.png', name: 'Matcha' }
            ].map((item, idx) => (
              <div key={idx} className="relative h-56 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition bg-white">
                <img 
                  src={item.img} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white font-['Iceland'] text-lg text-center">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toppings */}
        <div>
          <h3 className="text-2xl text-[#947E5A] font-['Iceland'] mb-4 text-center">🍓 Premium Toppings</h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {[
              { img: '/images/apple.png', name: 'Apple' },
              { img: '/images/cherry.png', name: 'Cherry' },
              { img: '/images/blueberry.png', name: 'Blueberry' },
              { img: '/images/raspberry.png', name: 'Raspberry' },
              { img: '/images/strawberry.png', name: 'Strawberry' }
            ].map((item, idx) => (
              <div key={idx} className="relative h-32 rounded-lg overflow-hidden shadow-md hover:scale-105 transition bg-white">
                <img 
                  src={item.img} 
                  alt={item.name}
                  className="w-full h-full object-contain p-2"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-white/90 py-1">
                  <p className="text-[#543429] font-['Iceland'] text-sm text-center">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/cart">
            <button className="px-6 py-3 bg-[#69806C] text-white font-['Iceland'] text-lg rounded-lg hover:bg-[#5a6e5e] transition shadow-md">
              View Full Menu →
            </button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
            <div className="text-5xl mb-3">🍧</div>
            <h3 className="text-xl font-['Iceland'] text-[#69806C] mb-2">Fresh Ingredients</h3>
            <p className="text-gray-600 font-['Iceland'] text-sm">Made with premium quality</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
            <div className="text-5xl mb-3">⚡</div>
            <h3 className="text-xl font-['Iceland'] text-[#69806C] mb-2">Quick Service</h3>
            <p className="text-gray-600 font-['Iceland'] text-sm">Track your order in real-time</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
            <div className="text-5xl mb-3">🎁</div>
            <h3 className="text-xl font-['Iceland'] text-[#69806C] mb-2">Loyalty Rewards</h3>
            <p className="text-gray-600 font-['Iceland'] text-sm">Earn stamps for free drinks</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
            <div className="text-5xl mb-3">🌟</div>
            <h3 className="text-xl font-['Iceland'] text-[#69806C] mb-2">Top Rated</h3>
            <p className="text-gray-600 font-['Iceland'] text-sm">4.9★ from 500+ reviews</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-[#543429] text-white py-8 px-4 mt-0">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-['Iceland'] text-lg mb-2">
            © 2025 Bingsu Order Management System
          </p>
        </div>
      </div>
    </div>
  );
}