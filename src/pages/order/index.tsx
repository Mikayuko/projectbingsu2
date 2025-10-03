// src/pages/order/index.tsx - Combined Order Tracking (Single Page)

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { api, getCurrentUser, isAuthenticated } from '@/utils/api';

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
  specialInstructions?: string;
}

export default function OrderHubPage() {
  const router = useRouter();
  const [trackingCode, setTrackingCode] = useState('');
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'track' | 'history'>('track');
  const user = getCurrentUser();

  // ✅ Track Order State
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (isAuthenticated() && activeTab === 'history') {
      fetchMyOrders();
    }
  }, [activeTab]);

  // ✅ Auto refresh tracked order
  useEffect(() => {
    if (trackedOrder && autoRefresh && trackedOrder.status !== 'Completed' && trackedOrder.status !== 'Cancelled') {
      const interval = setInterval(() => {
        trackOrderSilent(trackedOrder.customerCode);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [trackedOrder, autoRefresh]);

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const result = await api.getMyOrders();
      setMyOrders(result.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Track Order Function
  const handleTrack = async () => {
    if (!trackingCode.trim()) {
      setTrackError('Please enter a customer code');
      return;
    }

    const cleanCode = trackingCode.trim().toUpperCase();
    setLoading(true);
    setTrackError('');
    setTrackedOrder(null);

    try {
      console.log('🔍 Tracking order:', cleanCode);
      const result = await api.trackOrder(cleanCode);
      setTrackedOrder(result.order);
      console.log('✅ Order found:', result.order);
    } catch (err: any) {
      console.error('❌ Track error:', err);
      if (err.message.includes('404')) {
        setTrackError('Order not found. Please check your customer code.');
      } else {
        setTrackError(err.message || 'Failed to track order');
      }
      setTrackedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh for auto-update
  const trackOrderSilent = async (code: string) => {
    try {
      const result = await api.trackOrder(code);
      setTrackedOrder(result.order);
    } catch (error) {
      console.error('Silent track failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Preparing': 'bg-blue-100 text-blue-800',
      'Ready': 'bg-green-100 text-green-800',
      'Completed': 'bg-gray-100 text-gray-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pending': 'bg-yellow-500',
      'Preparing': 'bg-blue-500',
      'Ready': 'bg-green-500',
      'Completed': 'bg-gray-500',
      'Cancelled': 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'Pending': '⏳',
      'Preparing': '👨‍🍳',
      'Ready': '✅',
      'Completed': '🎉',
      'Cancelled': '❌'
    };
    return icons[status as keyof typeof icons] || '❓';
  };

  return (
    <div className="min-h-screen bg-[#EBE6DE]">
      {/* Header */}
      <div className="w-full h-[100px] bg-[#69806C] flex items-center px-10 shadow-lg">
        <Link href="/home">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition">
            <span className="text-white text-2xl">{'<'}</span>
          </div>
        </Link>
        <h1 className="ml-6 text-white text-3xl font-['Iceland']">Order Center</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-4xl text-[#69806C] font-['Iceland'] mb-4 text-center">
            🍧 Bingsu Order Management
          </h2>
          <p className="text-center text-gray-600 font-['Iceland'] text-lg">
            Track your order or view your order history
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1 inline-flex">
            <button
              onClick={() => {
                setActiveTab('track');
                setTrackedOrder(null);
                setTrackError('');
              }}
              className={`px-6 py-3 rounded-md font-['Iceland'] text-lg transition ${
                activeTab === 'track'
                  ? 'bg-[#69806C] text-white'
                  : 'text-[#69806C] hover:bg-gray-100'
              }`}
            >
              Track Order
            </button>
            {isAuthenticated() && (
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 rounded-md font-['Iceland'] text-lg transition ${
                  activeTab === 'history'
                    ? 'bg-[#69806C] text-white'
                    : 'text-[#69806C] hover:bg-gray-100'
                }`}
              >
                My Orders
              </button>
            )}
          </div>
        </div>

        {/* Track Order Tab */}
        {activeTab === 'track' && (
          <div className="space-y-6">
            {/* Track Form */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-6 text-center">
                Track Your Order
              </h3>
              
              <div className="max-w-2xl mx-auto">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-['Iceland']">
                    💡 Your customer code should look like: <strong>ABC12</strong>
                  </p>
                </div>

                <div className="flex gap-4 mb-4">
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => {
                      setTrackingCode(e.target.value.toUpperCase());
                      setTrackError('');
                    }}
                    placeholder="XXXXX"
                    className="flex-1 p-4 text-xl font-['Iceland'] border-2 border-[#69806C] rounded-lg focus:outline-none focus:border-[#5a6e5e] uppercase"
                    onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                    maxLength={6}
                    disabled={loading}
                  />
                  <button
                    onClick={handleTrack}
                    disabled={loading || !trackingCode.trim()}
                    className="px-8 py-4 bg-[#69806C] text-white text-xl font-['Iceland'] rounded-lg hover:bg-[#5a6e5e] transition disabled:opacity-50"
                  >
                    {loading ? 'Tracking...' : 'Track'}
                  </button>
                </div>

                {trackError && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded font-['Iceland']">
                    {trackError}
                  </div>
                )}
              </div>
            </div>

            {/* Tracked Order Display */}
            {trackedOrder && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                {/* Status Header */}
                <div className={`${getStatusColor(trackedOrder.status)} text-white rounded-lg p-6 mb-6 text-center`}>
                  <div className="text-6xl mb-2">{getStatusIcon(trackedOrder.status)}</div>
                  <h3 className="text-3xl font-['Iceland'] mb-2">Order {trackedOrder.status}</h3>
                  <p className="text-lg opacity-90 font-['Iceland']">
                    Order ID: {trackedOrder.orderId || trackedOrder._id}
                  </p>
                </div>

                {/* Auto Refresh Toggle */}
                {trackedOrder.status !== 'Completed' && trackedOrder.status !== 'Cancelled' && (
                  
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        
                        
                      </label>
                      
                    </div>
                  
                )}

                {/* Progress Timeline */}
                <div className="mb-6">
                  <h4 className="text-xl text-[#69806C] font-['Iceland'] mb-4">Order Progress</h4>
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-300"></div>
                    
                    {['Pending', 'Preparing', 'Ready', 'Completed'].map((step, index) => {
                      const steps = ['Pending', 'Preparing', 'Ready', 'Completed'];
                      const currentIndex = steps.indexOf(trackedOrder.status);
                      const isActive = currentIndex >= index;
                      
                      return (
                        <div key={step} className="relative mb-6">
                          <div className={`absolute -left-8 w-4 h-4 rounded-full ${
                            isActive ? 'bg-[#69806C]' : 'bg-gray-300'
                          }`}></div>
                          <p className={`font-['Iceland'] text-lg font-bold ${
                            isActive ? 'text-[#69806C]' : 'text-gray-400'
                          }`}>{step}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Details */}
                <div className="border-t pt-6">
                  <h4 className="text-xl text-[#69806C] font-['Iceland'] mb-4">Order Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg font-['Iceland']">
                    <div>
                      <p className="text-gray-600">Customer Code:</p>
                      <p className="font-bold text-[#543429]">{trackedOrder.customerCode.replace('#', '')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Cup Size:</p>
                      <p className="font-bold text-[#543429]">{trackedOrder.cupSize}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Flavor:</p>
                      <p className="font-bold text-[#543429]">{trackedOrder.shavedIce.flavor}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Toppings:</p>
                      <p className="font-bold text-[#543429]">
                        {trackedOrder.toppings.length > 0 
                          ? trackedOrder.toppings.map(t => t.name).join(', ')
                          : 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Price:</p>
                      <p className="text-2xl font-bold text-[#543429]">฿{trackedOrder.pricing.total}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ordered At:</p>
                      <p className="text-[#543429]">
                        {new Date(trackedOrder.createdAt).toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>
                  
                  {trackedOrder.specialInstructions && (
                    <div className="mt-4">
                      <p className="text-gray-600 font-['Iceland']">Special Instructions:</p>
                      <p className="bg-gray-50 p-3 rounded-lg mt-1 font-['Iceland']">
                        {trackedOrder.specialInstructions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Ready Alert */}
                {trackedOrder.status === 'Ready' && (
                  <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg animate-pulse">
                    <p className="text-green-800 font-['Iceland'] text-xl font-bold">
                      🎉 Your order is ready for pickup!
                    </p>
                    <p className="text-green-700 text-sm mt-1 font-['Iceland']">
                      Please come to the counter with code: <strong>{trackedOrder.customerCode.replace('#', '')}</strong>
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      setTrackedOrder(null);
                      setTrackingCode('');
                    }}
                    className="px-6 py-3 border-2 border-[#69806C] text-[#69806C] rounded-lg font-['Iceland'] hover:bg-[#69806C] hover:text-white transition"
                  >
                    Track Another Order
                  </button>
                  {trackedOrder.status === 'Completed' && (
                    <Link href="/review">
                      <button className="px-6 py-3 bg-[#947E5A] text-white rounded-lg font-['Iceland'] hover:bg-[#7a6648] transition">
                        Leave Review
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Info Cards (shown when no order tracked) */}
            {!trackedOrder && !trackError && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h4 className="font-['Iceland'] text-xl text-yellow-800 mb-3">
                    💡 How to track?
                  </h4>
                  <ol className="text-sm text-yellow-700 font-['Iceland'] space-y-2">
                    <li>1. Get your customer code after ordering</li>
                    <li>2. Enter the code above (e.g., #ABC12)</li>
                    <li>3. Click "Track" to see real-time status</li>
                  </ol>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-['Iceland'] text-xl text-blue-800 mb-3">
                    📱 Save your code!
                  </h4>
                  <p className="text-sm text-blue-700 font-['Iceland'] mb-3">
                    Take a photo or write down your customer code to track your order anytime.
                  </p>
                  <Link href="/home">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded font-['Iceland'] hover:bg-blue-700 transition">
                      Order New Bingsu →
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order History Tab - unchanged */}
        {activeTab === 'history' && isAuthenticated() && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-6">
              My Order History
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 font-['Iceland']">Loading orders...</p>
              </div>
            ) : myOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍧</div>
                <p className="text-gray-500 font-['Iceland'] text-lg mb-4">
                  No orders yet
                </p>
                <Link href="/home">
                  <button className="px-6 py-3 bg-[#69806C] text-white font-['Iceland'] rounded-lg hover:bg-[#5a6e5e] transition">
                    Make Your First Order
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order) => (
                  <div
                    key={order._id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xl font-['Iceland'] text-[#69806C] font-bold">
                          Order #{order.orderId}
                        </p>
                        <p className="text-sm text-gray-500 font-['Iceland']">
                          {new Date(order.createdAt).toLocaleString('th-TH')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-['Iceland'] font-bold ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 font-['Iceland']">Customer Code</p>
                        <p className="font-['Iceland'] text-[#543429] font-bold">{order.customerCode.replace('#', '')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-['Iceland']">Size</p>
                        <p className="font-['Iceland'] text-[#543429]">{order.cupSize}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-['Iceland']">Flavor</p>
                        <p className="font-['Iceland'] text-[#543429]">{order.shavedIce.flavor}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-['Iceland']">Total</p>
                        <p className="font-['Iceland'] text-[#543429] font-bold">฿{order.pricing.total}</p>
                      </div>
                    </div>

                    {order.toppings.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 font-['Iceland'] mb-1">Toppings</p>
                        <p className="font-['Iceland'] text-sm text-[#543429]">
                          {order.toppings.map(t => t.name).join(', ')}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setActiveTab('track');
                          // ✅ เอา # ออกก่อนส่งไป track
                          setTrackingCode(order.customerCode.replace('#', ''));
                          setTimeout(() => handleTrack(), 100);
                        }}
                        className="px-4 py-2 bg-[#69806C] text-white font-['Iceland'] text-sm rounded hover:bg-[#5a6e5e] transition"
                      >
                        Track Order
                      </button>
                      {order.status === 'Completed' && (
                        <Link href={`/review?orderId=${order._id}`}>
                          <button className="px-4 py-2 border border-[#69806C] text-[#69806C] font-['Iceland'] text-sm rounded hover:bg-[#69806C] hover:text-white transition">
                            Write Review
                          </button>
                        </Link>
                      )}
                      <Link href="/home">
                        <button className="px-4 py-2 border border-gray-300 text-gray-600 font-['Iceland'] text-sm rounded hover:bg-gray-100 transition">
                          Order Again
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loyalty Summary */}
            {user && (
              <div className="mt-8 p-6 bg-gradient-to-r from-[#69806C] to-[#947E5A] rounded-lg text-white">
                <h4 className="text-xl font-['Iceland'] mb-2">Your Rewards</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm opacity-80">Loyalty Points</p>
                    <p className="text-2xl font-bold font-['Iceland']">{user.loyaltyPoints || 0} pts</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Stamps Collected</p>
                    <p className="text-2xl font-bold font-['Iceland']">{user.loyaltyCard?.stamps || 0}/9</p>
                  </div>
                </div>
                {user.loyaltyCard?.stamps >= 7 && (
                  <p className="mt-3 text-sm font-['Iceland'] bg-white/20 rounded p-2">
                    🎉 Only {9 - user.loyaltyCard.stamps} more stamps until your free drink!
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Not Logged In */}
        {activeTab === 'history' && !isAuthenticated() && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">
              Login to View Order History
            </h3>
            <p className="text-gray-600 font-['Iceland'] mb-6">
              Sign in to access your order history and loyalty rewards
            </p>
            <Link href="/login">
              <button className="px-8 py-3 bg-[#69806C] text-white font-['Iceland'] text-lg rounded-lg hover:bg-[#5a6e5e] transition">
                Login Now
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}