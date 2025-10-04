// src/pages/admin/data-management/index.tsx - เพิ่มระบบสต๊อก

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, isAdmin, getCurrentUser } from '@/utils/api';
import { useRouter } from 'next/router';

interface StockItem {
  _id: string;
  itemType: 'flavor' | 'topping';
  name: string;
  quantity: number;
  reorderLevel: number;
  isActive: boolean;
  lastRestocked: string;
}

export default function DataManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'stock' | 'menu' | 'users' | 'stats'>('stock');
  const [loading, setLoading] = useState(true);
  
  // Stock State
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/login');
      return;
    }
    
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stock') {
        await loadStock();
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStock = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/stock`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load stock');
      
      const data = await response.json();
      const allItems = [...(data.flavors || []), ...(data.toppings || [])];
      setStockItems(allItems);
      setLowStockItems(data.lowStock || []);
    } catch (error) {
      console.error('Failed to load stock:', error);
      setStockItems([]);
    }
  };

  const handleInitializeStock = async () => {
    if (!confirm('Initialize default stock items?')) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/stock/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to initialize stock');
      
      const result = await response.json();
      alert(result.message);
      await loadStock();
    } catch (error: any) {
      alert(error.message || 'Failed to initialize stock');
    }
  };

  const handleUpdateStock = async () => {
    if (!editingStock) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/stock/${editingStock._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quantity: editingStock.quantity,
          reorderLevel: editingStock.reorderLevel,
          isActive: editingStock.isActive
        })
      });
      
      if (!response.ok) throw new Error('Failed to update stock');
      
      setShowStockModal(false);
      setEditingStock(null);
      await loadStock();
      alert('Stock updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update stock');
    }
  };

  const handleAdjustStock = async (id: string, adjustment: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/stock/${id}/adjust`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adjustment })
      });
      
      if (!response.ok) throw new Error('Failed to adjust stock');
      
      await loadStock();
    } catch (error: any) {
      alert(error.message || 'Failed to adjust stock');
    }
  };

  return (
    <div className="min-h-screen bg-[#EBE6DE]">
      <div className="w-full h-[80px] bg-[#69806C] flex items-center px-6 shadow-lg">
        <Link href="/admin">
          <div className="text-white text-2xl hover:opacity-80 cursor-pointer">{'<'}</div>
        </Link>
        <h1 className="ml-6 text-white text-3xl font-['Iceland']">Stock Management</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {lowStockItems.length > 0 && (
            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6">
              <h3 className="text-xl text-red-800 font-['Iceland'] mb-4">⚠️ Low Stock Alert ({lowStockItems.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lowStockItems.map(item => (
                  <div key={item._id} className="bg-white rounded-lg p-3">
                    <p className="font-['Iceland'] text-lg text-red-800">
                      {item.name} ({item.itemType})
                    </p>
                    <p className="text-sm text-red-600">
                      Quantity: <strong>{item.quantity}</strong> (Reorder at: {item.reorderLevel})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleInitializeStock}
              className="px-6 py-3 bg-[#947E5A] text-white rounded-lg hover:bg-[#7a6648] transition font-['Iceland']"
            >
              🏁 Initialize Default Stock
            </button>
            <button
              onClick={loadStock}
              className="px-6 py-3 bg-[#69806C] text-white rounded-lg hover:bg-[#5a6e5e] transition font-['Iceland']"
            >
              🔄 Refresh Stock
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">🍧 Flavors</h3>
              {stockItems.filter(s => s.itemType === 'flavor').length === 0 ? (
                <p className="text-gray-500 text-center py-8 font-['Iceland']">
                  No flavors in stock. Click "Initialize Default Stock" to add items.
                </p>
              ) : (
                <div className="space-y-3">
                  {stockItems.filter(s => s.itemType === 'flavor').map(item => (
                    <div key={item._id} className={`p-4 rounded-lg border-2 ${
                      item.quantity <= item.reorderLevel ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-['Iceland'] text-lg font-bold">{item.name}</h4>
                          <p className={`text-sm ${item.quantity <= item.reorderLevel ? 'text-red-600' : 'text-gray-600'}`}>
                            Quantity: <strong>{item.quantity}</strong> | Reorder: {item.reorderLevel}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-['Iceland'] ${
                          item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAdjustStock(item._id, -10)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm font-['Iceland'] hover:bg-red-600"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item._id, -1)}
                          className="px-3 py-1 bg-red-400 text-white rounded text-sm font-['Iceland'] hover:bg-red-500"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item._id, 1)}
                          className="px-3 py-1 bg-green-400 text-white rounded text-sm font-['Iceland'] hover:bg-green-500"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item._id, 10)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm font-['Iceland'] hover:bg-green-600"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => {
                            setEditingStock(item);
                            setShowStockModal(true);
                          }}
                          className="ml-auto px-4 py-1 bg-[#69806C] text-white rounded text-sm font-['Iceland'] hover:bg-[#5a6e5e]"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">🍓 Toppings</h3>
              {stockItems.filter(s => s.itemType === 'topping').length === 0 ? (
                <p className="text-gray-500 text-center py-8 font-['Iceland']">
                  No toppings in stock. Click "Initialize Default Stock" to add items.
                </p>
              ) : (
                <div className="space-y-3">
                  {stockItems.filter(s => s.itemType === 'topping').map(item => (
                    <div key={item._id} className={`p-4 rounded-lg border-2 ${
                      item.quantity <= item.reorderLevel ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-['Iceland'] text-lg font-bold">{item.name}</h4>
                          <p className={`text-sm ${item.quantity <= item.reorderLevel ? 'text-red-600' : 'text-gray-600'}`}>
                            Quantity: <strong>{item.quantity}</strong> | Reorder: {item.reorderLevel}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-['Iceland'] ${
                          item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAdjustStock(item._id, -10)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm font-['Iceland'] hover:bg-red-600"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item._id, -1)}
                          className="px-3 py-1 bg-red-400 text-white rounded text-sm font-['Iceland'] hover:bg-red-500"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item._id, 1)}
                          className="px-3 py-1 bg-green-400 text-white rounded text-sm font-['Iceland'] hover:bg-green-500"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item._id, 10)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm font-['Iceland'] hover:bg-green-600"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => {
                            setEditingStock(item);
                            setShowStockModal(true);
                          }}
                          className="ml-auto px-4 py-1 bg-[#69806C] text-white rounded text-sm font-['Iceland'] hover:bg-[#5a6e5e]"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showStockModal && editingStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-6">Edit Stock: {editingStock.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-['Iceland'] mb-2">Quantity</label>
                <input
                  type="number"
                  value={editingStock.quantity}
                  onChange={(e) => setEditingStock({ ...editingStock, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg font-['Iceland']"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-['Iceland'] mb-2">Reorder Level</label>
                <input
                  type="number"
                  value={editingStock.reorderLevel}
                  onChange={(e) => setEditingStock({ ...editingStock, reorderLevel: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg font-['Iceland']"
                  min="0"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingStock.isActive}
                    onChange={(e) => setEditingStock({ ...editingStock, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700 font-['Iceland']">Active (Available for ordering)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowStockModal(false);
                  setEditingStock(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-['Iceland'] hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStock}
                className="flex-1 px-4 py-3 bg-[#69806C] text-white rounded-lg font-['Iceland'] hover:bg-[#5a6e5e]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}