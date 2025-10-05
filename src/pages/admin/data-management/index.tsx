// src/pages/admin/data-management/index.tsx - Fixed Version

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, isAdmin, getCurrentUser } from '@/utils/api';
import { useRouter } from 'next/router';

interface MenuData {
  flavors: Array<{ name: string; price: number; active: boolean }>;
  toppings: Array<{ name: string; price: number; active: boolean }>;
  sizes: Array<{ size: string; price: number }>;
}

interface StockItem {
  _id: string;
  itemType: 'flavor' | 'topping';
  name: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  isActive: boolean;
  lastRestocked: Date | string;
}

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalReviews: number;
  averageRating: number;
  activeCodes: number;
  ratingDistribution?: { [key: string]: number };
}

export default function DataManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'menu' | 'users' | 'stats' | 'stock'>('menu');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Stock Management State
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  
  const [menuData, setMenuData] = useState<MenuData>({
    flavors: [
      { name: 'Strawberry', price: 60, active: true },
      { name: 'Thai Tea', price: 60, active: true },
      { name: 'Matcha', price: 60, active: true },
    ],
    toppings: [
      { name: 'Apple', price: 10, active: true },
      { name: 'Cherry', price: 10, active: true },
      { name: 'Blueberry', price: 10, active: true },
      { name: 'Raspberry', price: 10, active: true },
      { name: 'Strawberry', price: 10, active: true },
    ],
    sizes: [
      { size: 'S', price: 0 },
      { size: 'M', price: 10 },
      { size: 'L', price: 20 },
    ]
  });
  
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalReviews: 0,
    averageRating: 0,
    activeCodes: 0,
    ratingDistribution: {}
  });

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!isAdmin()) {
        router.push('/login');
        return;
      }
      
      await fetchData();
    };
    
    checkAdminAndFetch();
  }, [activeTab, filterRole, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const [orderStats, reviewStats, usersData] = await Promise.all([
          api.getOrderStats(),
          api.getReviews(1, 1),
          api.getAllUsers()
        ]);
        
        setStats({
          totalUsers: usersData?.users?.length || 0,
          totalOrders: orderStats?.todayOrders || 0,
          totalRevenue: orderStats?.todayRevenue || 0,
          totalReviews: reviewStats?.totalReviews || 0,
          averageRating: reviewStats?.stats?.average || 0,
          activeCodes: 10,
          ratingDistribution: reviewStats?.distribution || {}
        });
      } else if (activeTab === 'users') {
        await loadAllUsers();
      } else if (activeTab === 'stock') {
        await loadStockData();
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stock Management Functions
  const loadStockData = async () => {
    setStockLoading(true);
    try {
      const result = await api.getStock();
      const allStock = [...(result?.flavors || []), ...(result?.toppings || [])];
      setStockItems(allStock);
      setLowStockItems(result?.lowStock || []);
    } catch (error) {
      console.error('Failed to load stock:', error);
      alert('Failed to load stock data');
    } finally {
      setStockLoading(false);
    }
  };

  const handleInitializeStock = async () => {
    if (!confirm('This will create initial stock entries. Continue?')) return;
    
    setStockLoading(true);
    try {
      const result = await api.initializeStock();
      alert(`✅ Initialized ${result?.created || 0} stock items`);
      await loadStockData();
    } catch (error) {
      console.error('Failed to initialize stock:', error);
      alert('Failed to initialize stock');
    } finally {
      setStockLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!editingStock) return;
    
    setStockLoading(true);
    try {
      await api.updateStock(editingStock._id, {
        quantity: editingStock.quantity,
        reorderLevel: editingStock.reorderLevel,
        isActive: editingStock.isActive
      });
      
      await loadStockData();
      setShowStockModal(false);
      setEditingStock(null);
      alert('Stock updated successfully!');
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('Failed to update stock');
    } finally {
      setStockLoading(false);
    }
  };

  const handleAdjustStock = async (stockId: string, adjustment: number) => {
    setStockLoading(true);
    try {
      await api.adjustStock(stockId, adjustment);
      await loadStockData();
      alert(`Stock adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}`);
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      alert('Failed to adjust stock');
    } finally {
      setStockLoading(false);
    }
  };

  const handleRestockItem = async (stockId: string, itemName: string, currentQty: number) => {
    if (!confirm(`Restock ${itemName}?\nCurrent: ${currentQty}`)) return;
    
    setStockLoading(true);
    try {
      const result = await api.restockItem(stockId);
      alert(`✅ ${result.message}`);
      await loadStockData();
    } catch (error) {
      console.error('Failed to restock:', error);
      alert('Failed to restock item');
    } finally {
      setStockLoading(false);
    }
  };
  const loadAllUsers = async () => {
    try {
      const filters: any = {};
      if (filterRole) filters.role = filterRole;
      if (filterStatus) filters.isActive = filterStatus;
      if (searchTerm) filters.search = searchTerm;
      
      const result = await api.getAllUsers(filters);
      setUsers(result?.users || []);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  const handleSearch = () => {
    loadAllUsers();
  };

  const updateMenuPrice = (type: 'flavors' | 'toppings', index: number, newPrice: number) => {
    const updated = { ...menuData };
    updated[type][index].price = newPrice;
    setMenuData(updated);
  };

  const toggleItemActive = (type: 'flavors' | 'toppings', index: number) => {
    const updated = { ...menuData };
    updated[type][index].active = !updated[type][index].active;
    setMenuData(updated);
  };

  const handleEditUser = (user: any) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      
      const updates = {
        fullName: editingUser.fullName,
        email: editingUser.email,
        role: editingUser.role,
        loyaltyPoints: editingUser.loyaltyPoints,
        loyaltyCard: editingUser.loyaltyCard,
        isActive: editingUser.isActive
      };
      
      await api.updateUser(editingUser._id || editingUser.id, updates);
      
      await loadAllUsers();
      setShowEditModal(false);
      setEditingUser(null);
      alert('User updated successfully!');
    } catch (error: any) {
      console.error('Failed to update user:', error);
      alert(error?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setLoading(true);
        await api.deleteUser(userId);
        await loadAllUsers();
        alert('User deleted successfully!');
      } catch (error: any) {
        console.error('Failed to delete user:', error);
        alert(error?.message || 'Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      setLoading(true);
      const result = await api.toggleUserStatus(userId);
      await loadAllUsers();
      alert(result?.message || 'User status updated');
    } catch (error: any) {
      console.error('Failed to toggle user status:', error);
      alert(error?.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const exportMenuCSV = () => {
    let csv = 'Category,Name,Price,Status\n';
    
    menuData.flavors.forEach(flavor => {
      csv += `Flavor,${flavor.name},${flavor.price},${flavor.active ? 'Active' : 'Inactive'}\n`;
    });
    
    menuData.toppings.forEach(topping => {
      csv += `Topping,${topping.name},${topping.price},${topping.active ? 'Active' : 'Inactive'}\n`;
    });
    
    csv += '\nSize,Additional Price\n';
    menuData.sizes.forEach(size => {
      csv += `${size.size},${size.price}\n`;
    });
    
    downloadCSV(csv, 'menu_data');
  };

  const exportReviewStatsCSV = () => {
    let csv = 'Review Statistics Report\n\n';
    csv += 'Metric,Value\n';
    csv += `Total Reviews,${stats.totalReviews}\n`;
    csv += `Average Rating,${stats.averageRating.toFixed(2)}\n`;
    csv += `Total Orders,${stats.totalOrders}\n`;
    csv += `Total Revenue,${stats.totalRevenue}\n\n`;
    
    csv += 'Rating Distribution\n';
    csv += 'Stars,Count\n';
    
    if (stats.ratingDistribution) {
      for (let i = 5; i >= 1; i--) {
        csv += `${i} Stars,${stats.ratingDistribution[i] || 0}\n`;
      }
    }
    
    downloadCSV(csv, 'review_statistics');
  };

  const exportStockCSV = () => {
    let csv = 'Type,Name,Quantity,Unit,Reorder Level,Status,Last Restocked\n';
    
    stockItems.forEach(item => {
      const lastRestockedDate = new Date(item.lastRestocked).toLocaleDateString();
      csv += `${item.itemType},${item.name},${item.quantity},${item.unit},${item.reorderLevel},`;
      csv += `${item.isActive ? 'Active' : 'Inactive'},${lastRestockedDate}\n`;
    });
    
    csv += '\n\nLow Stock Alert\n';
    csv += 'Name,Type,Current Quantity,Reorder Level\n';
    lowStockItems.forEach(item => {
      csv += `${item.name},${item.itemType},${item.quantity},${item.reorderLevel}\n`;
    });
    
    downloadCSV(csv, 'stock_data');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const dataUri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-[#EBE6DE]">
      {/* Header */}
      <div className="w-full h-[80px] bg-[#69806C] flex items-center px-6 shadow-lg">
        <Link href="/admin">
          <div className="text-white text-2xl hover:opacity-80 cursor-pointer">{'<'}</div>
        </Link>
        <h1 className="ml-6 text-white text-3xl font-['Iceland']">Data Management</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md p-1 inline-flex mb-8">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-3 rounded-md font-['Iceland'] text-lg transition ${
              activeTab === 'menu'
                ? 'bg-[#69806C] text-white'
                : 'text-[#69806C] hover:bg-gray-100'
            }`}
          >
            Menu Management
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-md font-['Iceland'] text-lg transition ${
              activeTab === 'users'
                ? 'bg-[#69806C] text-white'
                : 'text-[#69806C] hover:bg-gray-100'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-6 py-3 rounded-md font-['Iceland'] text-lg transition ${
              activeTab === 'stock'
                ? 'bg-[#69806C] text-white'
                : 'text-[#69806C] hover:bg-gray-100'
            }`}
          >
            📦 Stock Management
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-md font-['Iceland'] text-lg transition ${
              activeTab === 'stats'
                ? 'bg-[#69806C] text-white'
                : 'text-[#69806C] hover:bg-gray-100'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* Menu Management Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl text-[#69806C] font-['Iceland']">Shaved Ice Flavors</h3>
                <button
                  onClick={exportMenuCSV}
                  className="px-4 py-2 bg-[#69806C] text-white rounded font-['Iceland'] hover:bg-[#5a6e5e] transition"
                >
                  📊 Export Menu as CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Flavor</th>
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Base Price</th>
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Status</th>
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuData.flavors.map((flavor, index) => (
                      <tr key={`${flavor.name}-${index}`} className="border-b">
                        <td className="py-3 font-['Iceland']">{flavor.name}</td>
                        <td className="py-3">
                          <input
                            type="number"
                            value={flavor.price}
                            onChange={(e) => updateMenuPrice('flavors', index, Number(e.target.value))}
                            className="w-20 p-1 border rounded font-['Iceland']"
                          />
                          <span className="ml-2 font-['Iceland']">฿</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-sm font-['Iceland'] ${
                            flavor.active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {flavor.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => toggleItemActive('flavors', index)}
                            className={`px-3 py-1 rounded text-sm font-['Iceland'] ${
                              flavor.active
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {flavor.active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">Toppings</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Topping</th>
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Price</th>
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Status</th>
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuData.toppings.map((topping, index) => (
                      <tr key={`${topping.name}-${index}`} className="border-b">
                        <td className="py-3 font-['Iceland']">{topping.name}</td>
                        <td className="py-3">
                          <input
                            type="number"
                            value={topping.price}
                            onChange={(e) => updateMenuPrice('toppings', index, Number(e.target.value))}
                            className="w-20 p-1 border rounded font-['Iceland']"
                          />
                          <span className="ml-2 font-['Iceland']">฿</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-sm font-['Iceland'] ${
                            topping.active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {topping.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => toggleItemActive('toppings', index)}
                            className={`px-3 py-1 rounded text-sm font-['Iceland'] ${
                              topping.active
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {topping.active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">Size Pricing</h3>
              <div className="grid grid-cols-3 gap-4">
                {menuData.sizes.map((size) => (
                  <div key={size.size} className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-['Iceland'] text-[#69806C] mb-2">{size.size}</div>
                    <div className="text-xl font-['Iceland']">+฿{size.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl text-[#69806C] font-['Iceland']">User Management</h3>
              <div className="text-sm text-gray-600 font-['Iceland']">
                Total Users: {users.length}
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full p-2 border border-gray-300 rounded font-['Iceland']"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="p-2 border border-gray-300 rounded font-['Iceland']"
              >
                <option value="">All Roles</option>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-2 border border-gray-300 rounded font-['Iceland']"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-[#69806C] text-white rounded font-['Iceland'] hover:bg-[#5a6e5e]"
              >
                Search
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 font-['Iceland']">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-500 font-['Iceland'] text-lg">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[#69806C]">
                      <th className="text-left py-3 px-4 font-['Iceland'] text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-['Iceland'] text-gray-700">Email</th>
                      <th className="text-center py-3 px-4 font-['Iceland'] text-gray-700">Role</th>
                      <th className="text-center py-3 px-4 font-['Iceland'] text-gray-700">Orders</th>
                      <th className="text-center py-3 px-4 font-['Iceland'] text-gray-700">Points</th>
                      <th className="text-center py-3 px-4 font-['Iceland'] text-gray-700">Status</th>
                      <th className="text-center py-3 px-4 font-['Iceland'] text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id || user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-['Iceland'] text-lg font-bold">{user.fullName}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-600 font-['Iceland']">{user.email}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-['Iceland'] font-bold ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-['Iceland']">
                          {user.orderCount || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-['Iceland'] font-bold">
                          {user.loyaltyPoints || 0}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-['Iceland'] ${
                            user.isActive !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {user.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEditUser(user)}
                              disabled={loading}
                              className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-['Iceland'] hover:bg-blue-600 disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user._id || user.id)}
                              disabled={loading}
                              className={`px-3 py-1 rounded text-sm font-['Iceland'] disabled:opacity-50 ${
                                user.isActive !== false
                                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                            >
                              {user.isActive !== false ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id || user.id)}
                              disabled={loading}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm font-['Iceland'] hover:bg-red-600 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Stock Management Tab */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl text-[#69806C] font-['Iceland']">📦 Stock Inventory</h3>
                <div className="flex gap-3">
                  {/* <button
                    onClick={handleInitializeStock}
                    disabled={stockLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded font-['Iceland'] hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    🔧 Initialize Stock
                  </button> */}
                  <button
                    onClick={exportStockCSV}
                    disabled={stockItems.length === 0}
                    className="px-4 py-2 bg-[#69806C] text-white rounded font-['Iceland'] hover:bg-[#5a6e5e] transition disabled:opacity-50"
                  >
                    📊 Export Stock CSV
                  </button>
                </div>
              </div>

              {/* Low Stock Alert */}
              {lowStockItems.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <h4 className="text-red-800 font-['Iceland'] text-lg font-bold mb-2">
                    ⚠️ Low Stock Alert ({lowStockItems.length} items)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {lowStockItems.map(item => (
                      <span key={item._id} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-['Iceland']">
                        {item.name}: {item.quantity}/{item.reorderLevel}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Table */}
              {stockLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#69806C] mx-auto mb-4"></div>
                  <p className="text-gray-500 font-['Iceland']">Loading stock data...</p>
                </div>
              ) : stockItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-500 font-['Iceland'] text-lg mb-4">No stock data found</p>
                  <button
                    onClick={handleInitializeStock}
                    className="px-6 py-3 bg-[#69806C] text-white rounded-lg font-['Iceland'] hover:bg-[#5a6e5e] transition"
                  >
                    Initialize Stock Now
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[#69806C]">
                        <th className="text-left py-3 px-4 font-['Iceland'] text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 font-['Iceland'] text-gray-700">Name</th>
                        <th className="text-center py-3 px-4 font-['Iceland'] text-gray-700">Quantity</th>
                        <th className="text-center py-3 px-4 font-['Iceland'] text-gray-700">Unit</th>
                        <th className="text-center py-3 px-4 font-['Iceland'] text-gray-700">Reorder Level</th>
                        <th className="text-center py-3 px-4 font-['Iceland'] text-gray-700">Status</th>
                        <th className="text-center py-3 px-4 font-['Iceland'] text-gray-700">Last Restocked</th>
                        <th className="text-center py-3 px-4 font-['Iceland'] text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockItems.map((item) => (
                        <tr key={item._id} className={`border-b hover:bg-gray-50 ${
                          item.quantity < item.reorderLevel ? 'bg-red-50' : ''
                        }`}>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-sm font-['Iceland'] ${
                              item.itemType === 'flavor' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {item.itemType}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-['Iceland'] font-bold">
                            {item.name}
                            {item.quantity < item.reorderLevel && (
                              <span className="ml-2 text-red-600">⚠️</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-['Iceland'] text-lg font-bold ${
                              item.quantity < item.reorderLevel ? 'text-red-600' : 'text-gray-800'
                            }`}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-['Iceland']">
                            {item.unit}
                          </td>
                          <td className="py-3 px-4 text-center font-['Iceland']">
                            {item.reorderLevel}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded text-sm font-['Iceland'] ${
                              item.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-sm font-['Iceland'] text-gray-600">
                            {new Date(item.lastRestocked).toLocaleDateString('th-TH')}
                          </td>
                          <td className="py-3 px-4">
                          <div className="flex gap-2 justify-center flex-wrap">
                            {/* ✅ ปุ่ม Restock */}
                            <button
                              onClick={() => handleRestockItem(item._id, item.name, item.quantity)}
                              disabled={stockLoading}
                              className="px-3 py-2 bg-green-500 text-white rounded text-sm font-['Iceland'] hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                            >
                          
                              <span>Restock</span>
                            </button>
                            
                            {/* ปุ่ม Edit */}
                            <button
                              onClick={() => {
                                setEditingStock(item);
                                setShowStockModal(true);
                              }}
                              disabled={stockLoading}
                              className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-['Iceland'] hover:bg-blue-600 disabled:opacity-50"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Stock Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Total Items</h4>
                <p className="text-3xl font-bold text-[#69806C]">{stockItems.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Low Stock Items</h4>
                <p className="text-3xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Active Items</h4>
                <p className="text-3xl font-bold text-green-600">
                  {stockItems.filter(i => i.isActive).length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Out of Stock</h4>
                <p className="text-3xl font-bold text-gray-600">
                  {stockItems.filter(i => i.quantity === 0).length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Total Users</h4>
                <p className="text-4xl font-bold text-[#69806C]">{stats.totalUsers}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Total Orders</h4>
                <p className="text-4xl font-bold text-[#69806C]">{stats.totalOrders}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Total Revenue</h4>
                <p className="text-4xl font-bold text-[#69806C]">฿{stats.totalRevenue}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl text-[#69806C] font-['Iceland']">Review Statistics</h3>
                <button
                  onClick={exportReviewStatsCSV}
                  className="px-4 py-2 bg-[#69806C] text-white rounded font-['Iceland'] hover:bg-[#5a6e5e] transition"
                >
                  📊 Export Stats as CSV
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 font-['Iceland'] mb-2">Total Reviews</p>
                  <p className="text-3xl font-bold text-[#69806C]">{stats.totalReviews}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-['Iceland'] mb-2">Average Rating</p>
                  <p className="text-3xl font-bold text-[#69806C]">
                    {stats.averageRating.toFixed(2)} ⭐
                  </p>
                </div>
              </div>
              {stats.ratingDistribution && (
                <div className="mt-6">
                  <p className="text-gray-600 font-['Iceland'] mb-4">Rating Distribution</p>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating} className="flex items-center gap-4 mb-2">
                      <span className="font-['Iceland'] w-16">{rating} ⭐</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-[#69806C] h-4 rounded-full transition-all"
                          style={{
                            width: `${stats.totalReviews > 0 
                              ? ((stats.ratingDistribution[rating] || 0) / stats.totalReviews * 100) 
                              : 0}%`
                          }}
                        ></div>
                      </div>
                      <span className="font-['Iceland'] w-12 text-right">
                        {stats.ratingDistribution[rating] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-6">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-['Iceland'] mb-2">Full Name</label>
                <input
                  type="text"
                  value={editingUser.fullName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full p-2 border rounded font-['Iceland']"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-['Iceland'] mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2 border rounded font-['Iceland']"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-['Iceland'] mb-2">Role</label>
                <select
                  value={editingUser.role || 'customer'}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full p-2 border rounded font-['Iceland']"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-['Iceland'] mb-2">Loyalty Points</label>
                <input
                  type="number"
                  value={editingUser.loyaltyPoints || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, loyaltyPoints: Number(e.target.value) })}
                  className="w-full p-2 border rounded font-['Iceland']"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingUser.isActive !== false}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-gray-700 font-['Iceland']">Active</label>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSaveUser}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#69806C] text-white rounded font-['Iceland'] hover:bg-[#5a6e5e] disabled:opacity-50"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded font-['Iceland'] hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {showStockModal && editingStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-6">Edit Stock Item</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-['Iceland'] mb-2">Item Name</label>
                <input
                  type="text"
                  value={editingStock.name}
                  disabled
                  className="w-full p-2 border rounded font-['Iceland'] bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-['Iceland'] mb-2">Quantity</label>
                <input
                  type="number"
                  value={editingStock.quantity}
                  onChange={(e) => setEditingStock({ ...editingStock, quantity: Number(e.target.value) })}
                  className="w-full p-2 border rounded font-['Iceland']"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-['Iceland'] mb-2">Reorder Level</label>
                <input
                  type="number"
                  value={editingStock.reorderLevel}
                  onChange={(e) => setEditingStock({ ...editingStock, reorderLevel: Number(e.target.value) })}
                  className="w-full p-2 border rounded font-['Iceland']"
                  min="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingStock.isActive}
                  onChange={(e) => setEditingStock({ ...editingStock, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-gray-700 font-['Iceland']">Active</label>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleUpdateStock}
                disabled={stockLoading}
                className="flex-1 px-4 py-2 bg-[#69806C] text-white rounded font-['Iceland'] hover:bg-[#5a6e5e] disabled:opacity-50"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowStockModal(false);
                  setEditingStock(null);
                }}
                disabled={stockLoading}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded font-['Iceland'] hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}