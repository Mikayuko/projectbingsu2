// src/pages/profile/index.tsx - Full MongoDB Integration

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import LogoutModal from '@/components/LogoutModal';
import { getCurrentUser, isAuthenticated, User, api } from '@/utils/api';

interface Order {
  _id: string;
  orderId: string;
  customerCode: string;
  cupSize: string;
  shavedIce: { flavor: string };
  toppings: Array<{ name: string }>;
  pricing: { total: number };
  status: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const result = await api.getProfile();
      setUser(result.user);
      await loadUserOrders();
    } catch (error) {
      console.error('Failed to load profile:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadUserOrders = async () => {
    try {
      const result = await api.getMyOrders();
      setUserOrders(result.orders || []);
    } catch (error) {
      console.error('Failed to load user orders:', error);
      setUserOrders([]);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      alert('Successfully logged out!');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
    setShowLogout(false);
  };

  const calculateLoyaltyProgress = () => {
    if (!user) return { percentage: 0, nextStamp: 9 };
    const stamps = user.loyaltyCard?.stamps || 0;
    const percentage = (stamps / 9) * 100;
    const nextStamp = 9 - stamps;
    return { percentage, nextStamp };
  };

  const getRecentActivity = () => {
    return userOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBE6DE] flex items-center justify-center">
        <p className="text-2xl text-[#69806C] font-['Iceland']">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#EBE6DE] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-[#69806C] font-['Iceland'] mb-4">Please log in to view your profile</p>
          <Link href="/login">
            <button className="px-6 py-3 bg-[#69806C] text-white font-['Iceland'] text-lg rounded-lg hover:bg-[#5a6e5e] transition">
              Go to Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const loyaltyProgress = calculateLoyaltyProgress();
  const recentActivity = getRecentActivity();

  return (
    <>
      <div className="min-h-screen w-full bg-[#EBE6DE] flex flex-col items-center justify-start relative overflow-hidden">
        {/* Header */}
        <div className="w-full h-[100px] bg-[#69806C] flex items-center px-10 justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <Link href="/home">
              <div className="w-12 h-12 bg-white/20 rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-white/30 transition">
                <span className="text-white text-2xl">{'<'}</span>
              </div>
            </Link>
            <h1 className="text-white text-3xl font-['Iceland']">My Profile</h1>
          </div>
        </div>

        {/* Profile Card */}
        <div className="w-full flex justify-center mt-10">
          <div className="w-[90%] max-w-[500px] bg-gradient-to-b from-[#69806C] to-[#EBE6DE] border border-white/50 shadow-xl rounded-xl p-6 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-3xl font-['Iceland']">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-white text-4xl font-['Iceland'] mb-2">{user.fullName}</h2>
            <p className="text-white/90 text-xl font-['Iceland'] mb-4">{user.email}</p>
            
            {/* User Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-white">
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-sm opacity-80 font-['Iceland']">Loyalty Points</p>
                <p className="text-2xl font-bold font-['Iceland']">{user.loyaltyPoints}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-sm opacity-80 font-['Iceland']">Total Orders</p>
                <p className="text-2xl font-bold font-['Iceland']">{userOrders.length}</p>
              </div>
            </div>

            <button
              className="w-[145px] h-[60px] bg-[#DBD9D4] border border-white text-[#B51212] text-2xl font-['Iceland'] shadow-md hover:scale-105 transition"
              onClick={() => setShowLogout(true)}
            >
              Log out
            </button>
          </div>
        </div>

        {/* Loyalty Section */}
        <div className="w-full bg-[#947E5A] mt-20 py-10 px-4">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start gap-10 relative">
            {/* Welcome Message */}
            <div className="bg-[#EBE6DE]/40 border-4 border-white shadow-xl backdrop-blur-md rounded-r-[50px] px-10 py-6">
              <h1 className="text-white text-4xl font-['Iceland'] drop-shadow">
                WELCOME TO THE LOYAL CLUB
              </h1>
            </div>

            {/* Card Rewards */}
            <div className="flex-1 bg-[#EBE6DE]/50 border border-white/50 backdrop-blur-xl shadow-xl rounded-xl overflow-hidden">
              <div className="bg-[#69806C] text-white py-4 text-center text-3xl font-['Iceland'] border-b border-white/25">
                Get your 9th drink for free!
              </div>
              <div className="p-6">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#69806C] font-['Iceland'] text-lg">
                      Progress: {user.loyaltyCard.stamps}/9
                    </span>
                    <span className="text-[#69806C] font-['Iceland'] text-sm">
                      {loyaltyProgress.nextStamp} more for free drink!
                    </span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-3">
                    <div 
                      className="bg-[#69806C] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${loyaltyProgress.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stamp Cards */}
                <div className="grid grid-cols-5 gap-4 place-items-center">
                  {[...Array(9)].map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-[70px] h-[70px] rounded-full border-2 border-white flex items-center justify-center transition-all ${
                        idx < user.loyaltyCard.stamps
                          ? 'bg-[#69806C] text-white text-xl'
                          : idx === 8
                          ? 'bg-[#EBE6DE] text-[#69806C] text-sm font-bold'
                          : 'bg-[#EBE6DE]'
                      }`}
                    >
                      {idx < user.loyaltyCard.stamps ? '✓' : 
                       idx === 8 ? 'Free' : idx + 1}
                    </div>
                  ))}
                </div>

                {/* Loyalty Stats */}
                <div className="mt-6 text-center">
                  <p className="text-[#69806C] font-['Iceland'] text-lg">
                    Total Free Drinks Earned: <span className="font-bold">{user.loyaltyCard.totalFreeDrinks}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="w-full max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-3xl text-[#69806C] font-['Iceland'] mb-6 text-center">Recent Activity</h2>
          
          {recentActivity.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">🧊</div>
              <p className="text-gray-500 font-['Iceland'] text-lg mb-4">No orders yet</p>
              <Link href="/home">
                <button className="px-6 py-3 bg-[#69806C] text-white font-['Iceland'] rounded-lg hover:bg-[#5a6e5e] transition">
                  Order Your First Bingsu
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentActivity.map((order) => (
                <div key={order._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-lg font-['Iceland'] text-[#69806C] font-bold">
                      {order.orderId}
                    </p>
                    <span className={`px-2 py-1 rounded text-xs font-['Iceland'] ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'Ready' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'Preparing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 font-['Iceland'] mb-2">
                    {order.shavedIce?.flavor} - Size {order.cupSize}
                  </p>
                  
                  <p className="text-lg font-['Iceland'] text-[#543429] font-bold mb-2">
                    ฿{order.pricing?.total || 0}
                  </p>
                  
                  <p className="text-xs text-gray-500 font-['Iceland']">
                    {new Date(order.createdAt).toLocaleDateString('th-TH')}
                  </p>
                  
                  <Link href={`/order/track?code=${order.customerCode}`}>
                    <button className="w-full mt-3 py-2 bg-[#69806C] text-white font-['Iceland'] text-sm rounded hover:bg-[#5a6e5e] transition">
                      Track Order
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* View All Orders Button */}
          {userOrders.length > 3 && (
            <div className="text-center mt-8">
              <Link href="/order">
                <button className="px-8 py-3 bg-[#947E5A] text-white font-['Iceland'] text-lg rounded-lg hover:bg-[#7a6648] transition">
                  View All Orders →
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="w-full h-[100px] bg-[#69806C]" />
      </div>

      {/* Logout Modal */}
      <LogoutModal
        show={showLogout}
        onCancel={() => setShowLogout(false)}
        onLogout={handleLogout}
      />
    </>
  );
}