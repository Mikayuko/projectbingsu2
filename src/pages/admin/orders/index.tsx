// src/pages/admin/orders/index.tsx - Real-time + Notifications (ไม่มีเสียง)

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/utils/api';

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    popularFlavor: ''
  });
  
  // ✅ Real-time state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    fetchOrders();
    fetchStats();
    requestNotificationPermission();
  }, [filter]);

  // ✅ Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchOrdersSilent();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, filter, orders]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const filters = filter !== 'all' ? { status: filter } : {};
      const result = await api.getAllOrders(filters);
      setOrders(result.orders || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Silent refresh (ไม่แสดง loading)
  const fetchOrdersSilent = async () => {
    try {
      const filters = filter !== 'all' ? { status: filter } : {};
      const result = await api.getAllOrders(filters);
      const newOrders = result.orders || [];
      
      // ตรวจสอบว่ามี order ใหม่หรือไม่
      const oldIds = new Set(orders.map(o => o._id));
      const addedOrders = newOrders.filter((o: Order) => !oldIds.has(o._id));
      
      if (addedOrders.length > 0) {
        setNewOrdersCount(prev => prev + addedOrders.length);
        
        // ✅ แจ้งเตือน (ไม่มีเสียง)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🍧 New Bingsu Order!', {
            body: `${addedOrders.length} new order(s) received`,
            icon: '/favicon.ico',
            silent: true
          });
        }
      }
      
      setOrders(newOrders);
      setLastRefresh(new Date());
      await fetchStats();
    } catch (error) {
      console.error('Silent refresh failed:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await api.getOrderStats();
      setStats({
        todayOrders: result.todayOrders || 0,
        todayRevenue: result.todayRevenue || 0,
        pendingOrders: result.pendingOrders || 0,
        popularFlavor: result.popularFlavors?.[0]?._id || 'N/A'
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      await fetchOrders();
      await fetchStats();
      alert(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };

  const handleRefreshNow = () => {
    setNewOrdersCount(0);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pending': 'text-yellow-600 bg-yellow-50',
      'Preparing': 'text-blue-600 bg-blue-50',
      'Ready': 'text-green-600 bg-green-50',
      'Completed': 'text-gray-600 bg-gray-50',
      'Cancelled': 'text-red-600 bg-red-50'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'Pending': 'Preparing',
      'Preparing': 'Ready',
      'Ready': 'Completed'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  return (
    <div className="min-h-screen bg-[#EBE6DE]">
      <div className="w-full h-[80px] bg-[#69806C] flex items-center px-6 shadow-lg">
        <Link href="/admin">
          <div className="text-white text-2xl hover:opacity-80 cursor-pointer">{'<'}</div>
        </Link>
        <h1 className="ml-6 text-white text-3xl">Order Management</h1>
        
        {/* ✅ Refresh Controls */}
        <div className="ml-auto flex items-center gap-4">
          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Auto-refresh (10s)</span>
          </label>
          
          <button
            onClick={handleRefreshNow}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white flex items-center gap-2 transition"
          >
            <span>🔄</span>
            <span>Refresh Now</span>
            {newOrdersCount > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
                +{newOrdersCount}
              </span>
            )}
          </button>
          
          <p className="text-white/70 text-sm">
            Last: {lastRefresh.toLocaleTimeString('th-TH')}
          </p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Today's Orders</p>
          <p className="text-3xl font-bold text-[#69806C]">{stats.todayOrders}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Pending Orders</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Today's Revenue</p>
          <p className="text-3xl font-bold text-[#69806C]">฿{stats.todayRevenue}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Popular Flavor</p>
          <p className="text-2xl font-bold text-[#69806C]">{stats.popularFlavor}</p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex gap-2 mb-6">
          {['all', 'Pending', 'Preparing', 'Ready', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-lg transition ${
                filter === status
                  ? 'bg-[#69806C] text-white'
                  : 'bg-white text-[#69806C] hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'All Orders' : status}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-xl">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500 text-xl">No orders found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-2xl font-bold text-[#69806C]">
                      Order #{order.orderId}
                    </p>
                    <p className="text-gray-600">
                      Customer: {order.customerCode}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="border-t border-b py-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Size:</span>
                      <span className="ml-2 font-bold">{order.cupSize}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Flavor:</span>
                      <span className="ml-2 font-bold">{order.shavedIce.flavor}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Toppings:</span>
                      <span className="ml-2 font-bold">
                        {order.toppings.length > 0 
                          ? order.toppings.map(t => t.name).join(', ')
                          : 'None'}
                      </span>
                    </div>
                  </div>
                  {order.specialInstructions && (
                    <div className="mt-2">
                      <span className="text-gray-600 text-sm">Note:</span>
                      <span className="ml-2 text-sm italic">{order.specialInstructions}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <p className="text-2xl font-bold text-[#69806C]">
                    ฿{order.pricing.total}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                    <>
                      {getNextStatus(order.status) && (
                        <button
                          onClick={() => updateOrderStatus(order._id, getNextStatus(order.status)!)}
                          className="flex-1 px-4 py-2 bg-[#69806C] text-white rounded-lg hover:bg-[#5a6e5e]"
                        >
                          Mark as {getNextStatus(order.status)}
                        </button>
                      )}
                      <button
                        onClick={() => updateOrderStatus(order._id, 'Cancelled')}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {order.status === 'Completed' && (
                    <span className="flex-1 text-center py-2 text-gray-500">Order Completed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}