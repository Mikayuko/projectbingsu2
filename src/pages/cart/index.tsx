// src/pages/cart/index.tsx - Gallery with MongoDB Stock Status

import { useState, useEffect } from 'react';
import Link from "next/link";
import { api } from '@/utils/api';

interface MenuItem {
  flavor: string;
  image: string;
  available?: boolean;
  stock?: number;
}

interface ToppingItem {
  name: string;
  image: string;
  available?: boolean;
  stock?: number;
}

export default function GalleryPage() {
  const [bingsuMenu, setBingsuMenu] = useState<MenuItem[]>([
    { flavor: "Strawberry", image: "/images/strawberry-ice.png" },
    { flavor: "Thai Tea", image: "/images/thai-tea-ice.png" },
    { flavor: "Matcha", image: "/images/matcha-ice.png" },
  ]);

  const [toppings, setToppings] = useState<ToppingItem[]>([
    { name: "Apple", image: "/images/apple.png" },
    { name: "Blueberry", image: "/images/blueberry.png" },
    { name: "Cherry", image: "/images/cherry.png" },
    { name: "Raspberry", image: "/images/raspberry.png" },
    { name: "Strawberry", image: "/images/strawberry.png" },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStockStatus();
  }, []);

  // ✅ Load stock status from MongoDB
  const loadStockStatus = async () => {
    setLoading(true);
    try {
      const [flavorsResult, toppingsResult] = await Promise.all([
        api.getAvailableItems('flavor'),
        api.getAvailableItems('topping')
      ]);

      // Update bingsu menu with stock status
      const updatedMenu = bingsuMenu.map(item => {
        const stockItem = flavorsResult.items?.find((s: any) => 
          s.name.toLowerCase() === item.flavor.toLowerCase()
        );
        return {
          ...item,
          available: stockItem ? stockItem.isActive && stockItem.quantity > 0 : false,
          stock: stockItem?.quantity || 0
        };
      });

      // Update toppings with stock status
      const updatedToppings = toppings.map(item => {
        const stockItem = toppingsResult.items?.find((s: any) => 
          s.name.toLowerCase() === item.name.toLowerCase()
        );
        return {
          ...item,
          available: stockItem ? stockItem.isActive && stockItem.quantity > 0 : false,
          stock: stockItem?.quantity || 0
        };
      });

      setBingsuMenu(updatedMenu);
      setToppings(updatedToppings);
    } catch (error) {
      console.error('Failed to load stock status:', error);
      // If API fails, show all as available
      setBingsuMenu(prev => prev.map(item => ({ ...item, available: true, stock: 100 })));
      setToppings(prev => prev.map(item => ({ ...item, available: true, stock: 100 })));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EBE6DE]">
      {/* Header */}
      <div className="w-full bg-[#69806C] py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/home">
            <button className="text-white hover:bg-white/20 p-2 rounded-full transition">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-['Iceland'] text-white text-center">
            Bingsu Menu Gallery
          </h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#69806C] mx-auto mb-4"></div>
            <p className="text-gray-500 font-['Iceland']">Loading menu...</p>
          </div>
        ) : (
          <>
            {/* Bingsu Gallery */}
            <h2 className="text-3xl font-['Iceland'] text-[#69806C] mb-8">Bingsu Flavors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {bingsuMenu.map((item, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Stock Status Badge */}
                  {item.stock !== undefined && (
                    <div className={`absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-sm font-['Iceland'] font-bold ${
                      !item.available 
                        ? 'bg-red-600 text-white' 
                        : item.stock <= 10 
                        ? 'bg-yellow-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {!item.available ? 'Out of Stock' : item.stock <= 10 ? `Only ${item.stock} left!` : 'Available'}
                    </div>
                  )}
                  
                  <img
                    src={item.image}
                    alt={item.flavor}
                    className={`h-[500px] w-full object-cover object-[center_70%] aspect-5 bg-white ${
                      !item.available ? 'opacity-50' : ''
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  <h3 className="absolute bottom-4 left-4 text-white text-2xl font-['Iceland'] drop-shadow-lg">
                    {item.flavor} Bingsu
                  </h3>
                </div>
              ))}
            </div>

            {/* Topping Gallery */}
            <h2 className="text-3xl font-['Iceland'] text-[#69806C] mb-8">Toppings</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {toppings.map((topping, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Stock Status Badge */}
                  {topping.stock !== undefined && (
                    <div className={`absolute top-2 right-2 z-20 px-2 py-1 rounded-full text-xs font-['Iceland'] font-bold ${
                      !topping.available 
                        ? 'bg-red-600 text-white' 
                        : topping.stock <= 10 
                        ? 'bg-yellow-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {!topping.available ? 'Out' : topping.stock <= 10 ? `${topping.stock} left` : 'In Stock'}
                    </div>
                  )}
                  
                  <img
                    src={topping.image}
                    alt={topping.name}
                    className={`h-60 w-full object-contain bg-white ${
                      !topping.available ? 'opacity-50' : ''
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <h3 className="absolute bottom-3 left-3 text-white text-lg font-['Iceland'] drop-shadow-md">
                    {topping.name}
                  </h3>
                </div>
              ))}
            </div>

            {/* Info Section */}
            <div className="mt-16 p-8 bg-white rounded-xl shadow-lg">
              <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">Menu Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-['Iceland'] text-lg text-gray-700 mb-2">🍧 Base Prices</h4>
                  <ul className="space-y-1 text-gray-600 font-['Iceland']">
                    <li>• Shaved Ice Base: ฿60</li>
                    <li>• Size S: +฿0</li>
                    <li>• Size M: +฿10</li>
                    <li>• Size L: +฿20</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-['Iceland'] text-lg text-gray-700 mb-2">🍓 Topping Prices</h4>
                  <ul className="space-y-1 text-gray-600 font-['Iceland']">
                    <li>• Each topping: +฿10</li>
                    <li>• Maximum 3 toppings per order</li>
                    <li>• All toppings are fresh daily</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 font-['Iceland']">
                  💡 <strong>Tip:</strong> Get a menu code from the staff to start your order!
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}