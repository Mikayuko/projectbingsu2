// src/pages/menu/index.tsx - Full MongoDB Integration

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { api } from '@/utils/api';

interface MenuItem {
  name: string;
  score: number;
  description: string;
  image: string;
  color?: string;
  textColor?: string;
  available?: boolean;
  stock?: number;
}

export default function MenuPage() {
  const router = useRouter();
  const { code } = router.query;
  
  const [menuCode, setMenuCode] = useState('');
  const [cupSize, setCupSize] = useState<string>('M');
  const [selectedFlavor, setSelectedFlavor] = useState<MenuItem | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<MenuItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customerCode, setCustomerCode] = useState('');
  const [validating, setValidating] = useState(false);
  
  // ✅ MongoDB Stock Data
  const [availableFlavors, setAvailableFlavors] = useState<MenuItem[]>([]);
  const [availableToppings, setAvailableToppings] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Default menu items (used as fallback)
  const defaultFlavors: MenuItem[] = [
    {
      name: 'Strawberry',
      score: 1,
      description: 'A sweet, icy kiss of summer!',
      image: '/images/strawberry-ice.png',
      color: '#B23434',
    },
    {
      name: 'Thai Tea',
      score: 2,
      description: 'Bold. Creamy. Unmistakably Thai.',
      image: '/images/thai-tea-ice.png',
      color: '#CD9445',
    },
    {
      name: 'Matcha',
      score: 3,
      description: 'Earthy. Creamy. Cool.',
      image: '/images/matcha-ice.png',
      color: '#527657',
    },
  ];

  const defaultToppings: MenuItem[] = [
    { name: 'Apple', score: 1, description: 'Juicy crunch', image: '/images/apple.png', textColor: '#B51212' },
    { name: 'Cherry', score: 2, description: 'Sweet & tangy', image: '/images/cherry.png', textColor: '#B51212' },
    { name: 'Blueberry', score: 3, description: 'Sweet berries', image: '/images/blueberry.png', textColor: '#354088' },
    { name: 'Raspberry', score: 4, description: 'Bold & tangy', image: '/images/raspberry.png', textColor: '#B51212' },
    { name: 'Strawberry', score: 5, description: 'Sweet & juicy', image: '/images/strawberry.png', textColor: '#B51212' },
  ];

  useEffect(() => {
    if (code) {
      validateCode(code as string);
    }
    loadAvailableItems();
  }, [code]);

  // ✅ Load available items from MongoDB Stock
  const loadAvailableItems = async () => {
    setLoadingMenu(true);
    try {
      const [flavorsResult, toppingsResult] = await Promise.all([
        api.getAvailableItems('flavor'),
        api.getAvailableItems('topping')
      ]);

      // Map MongoDB data to menu items with stock info
      const flavorsWithStock = defaultFlavors.map(flavor => {
        const stockItem = flavorsResult.items?.find((item: any) => 
          item.name.toLowerCase() === flavor.name.toLowerCase()
        );
        return {
          ...flavor,
          available: stockItem ? stockItem.isActive && stockItem.quantity > 0 : false,
          stock: stockItem?.quantity || 0
        };
      });

      const toppingsWithStock = defaultToppings.map(topping => {
        const stockItem = toppingsResult.items?.find((item: any) => 
          item.name.toLowerCase() === topping.name.toLowerCase()
        );
        return {
          ...topping,
          available: stockItem ? stockItem.isActive && stockItem.quantity > 0 : false,
          stock: stockItem?.quantity || 0
        };
      });

      setAvailableFlavors(flavorsWithStock);
      setAvailableToppings(toppingsWithStock);
    } catch (error) {
      console.error('Failed to load stock data:', error);
      // Use default items if stock API fails
      setAvailableFlavors(defaultFlavors.map(f => ({ ...f, available: true, stock: 100 })));
      setAvailableToppings(defaultToppings.map(t => ({ ...t, available: true, stock: 100 })));
    } finally {
      setLoadingMenu(false);
    }
  };

  const validateCode = async (codeStr: string) => {
    setValidating(true);
    setError('');
    
    try {
      const result = await api.validateMenuCode(codeStr.toUpperCase());
      
      if (result.valid) {
        setMenuCode(codeStr.toUpperCase());
        setCupSize(result.cupSize);
        setShowOrderForm(true);
      } else {
        setError(result.message || 'Invalid menu code');
        setShowOrderForm(false);
      }
    } catch (err: any) {
      console.error('Code validation failed:', err);
      setError('Invalid menu code. Please get a valid code from the home page.');
      setShowOrderForm(false);
    } finally {
      setValidating(false);
    }
  };

  const toggleTopping = (topping: MenuItem) => {
    if (!topping.available) {
      setError(`Sorry, ${topping.name} is out of stock`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSelectedToppings(prev => {
      const exists = prev.find(t => t.name === topping.name);
      if (exists) {
        return prev.filter(t => t.name !== topping.name);
      }
      if (prev.length >= 3) {
        setError('Maximum 3 toppings allowed');
        setTimeout(() => setError(''), 3000);
        return prev;
      }
      return [...prev, topping];
    });
  };

  const selectFlavor = (flavor: MenuItem) => {
    if (!flavor.available) {
      setError(`Sorry, ${flavor.name} is out of stock`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    setSelectedFlavor(flavor);
    setError('');
  };

  const calculateTotal = () => {
    let total = 60; // Base price
    const sizePrice = { S: 0, M: 10, L: 20 };
    total += sizePrice[cupSize as keyof typeof sizePrice] || 0;
    total += selectedToppings.length * 10;
    return total;
  };

  const validateOrder = () => {
    if (!selectedFlavor) {
      setError('Please select a shaved ice flavor');
      return false;
    }
    
    if (!selectedFlavor.available) {
      setError(`Sorry, ${selectedFlavor.name} is no longer available`);
      return false;
    }
    
    // Check if selected toppings are still available
    const unavailableToppings = selectedToppings.filter(t => !t.available);
    if (unavailableToppings.length > 0) {
      setError(`Sorry, these toppings are no longer available: ${unavailableToppings.map(t => t.name).join(', ')}`);
      return false;
    }
    
    return true;
  };

  const handleCreateOrder = async () => {
    if (!validateOrder()) return;

    setLoading(true);
    setError('');

    try {
      const orderData = {
        menuCode: menuCode.toUpperCase(),
        shavedIce: {
          flavor: selectedFlavor!.name,
          points: selectedFlavor!.score
        },
        toppings: selectedToppings.map(t => ({
          name: t.name,
          points: t.score
        })),
        specialInstructions
      };

      const result = await api.createOrder(orderData);
      setCustomerCode(result.customerCode.replace('#', ''));
      setShowSuccessModal(true);
      
      // Reload stock after successful order
      await loadAvailableItems();
      
    } catch (err: any) {
      console.error('Order creation failed:', err);
      if (err.message.includes('out of stock')) {
        setError(err.message);
        // Reload stock to get latest availability
        await loadAvailableItems();
      } else {
        setError(err.message || 'Failed to create order');
      }
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen w-full bg-[#EBE6DE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#69806C] mx-auto mb-4"></div>
          <p className="text-2xl text-[#69806C] font-['Iceland']">Validating menu code...</p>
        </div>
      </div>
    );
  }

  if (!showOrderForm) {
    return (
      <div className="min-h-screen w-full bg-[#EBE6DE] flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl text-[#69806C] font-['Iceland'] mb-4 text-center">
            {error || 'No Menu Code Detected'}
          </h2>
          <p className="text-gray-600 font-['Iceland'] mb-6 text-center">
            Please enter a valid menu code from the home page
          </p>
          <Link href="/home">
            <button className="w-full py-3 bg-[#69806C] text-white font-['Iceland'] text-lg rounded-lg hover:bg-[#5a6e5e] transition">
              Go to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#EBE6DE]">
      {/* Header */}
      <div className="w-full h-[100px] bg-[#69806C] flex items-center px-10 justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/home">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition">
              <span className="text-white text-2xl">{'<'}</span>
            </div>
          </Link>
          <h1 className="text-white text-3xl font-['Iceland']">Create Order</h1>
        </div>
        <div className="text-white font-['Iceland']">
          Code: <span className="font-bold">{menuCode}</span> | 
          Size: <span className="font-bold">{cupSize}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded font-['Iceland']">
            {error}
          </div>
        )}

        {loadingMenu ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#69806C] mx-auto mb-4"></div>
            <p className="text-gray-500 font-['Iceland']">Loading menu...</p>
          </div>
        ) : (
          <>
            {/* Shaved Ice Selection */}
            <div className="mb-12">
              <h3 className="text-3xl text-[#69806C] mb-6 text-center font-['Iceland']">
                Step 1: Select Flavor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {availableFlavors.map((flavor) => (
                  <div
                    key={flavor.name}
                    onClick={() => selectFlavor(flavor)}
                    className={`cursor-pointer rounded-lg border-2 transition bg-white overflow-hidden relative ${
                      !flavor.available ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      selectedFlavor?.name === flavor.name
                        ? 'border-[#69806C] shadow-lg transform scale-105'
                        : 'border-gray-300 hover:border-[#69806C] hover:shadow-md'
                    }`}
                  >
                    {!flavor.available && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-['Iceland'] text-xl">
                          Out of Stock
                        </span>
                      </div>
                    )}
                    {flavor.stock !== undefined && flavor.stock <= 10 && flavor.available && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-['Iceland'] z-10">
                        Only {flavor.stock} left!
                      </div>
                    )}
                    <div className="h-48 relative">
                      <img src={flavor.image} alt={flavor.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6">
                      <h4 className="text-2xl font-['Iceland'] mb-2 text-center" style={{ color: flavor.color }}>
                        {flavor.name}
                      </h4>
                      <p className="text-sm text-gray-600 text-center">{flavor.description}</p>
                      {selectedFlavor?.name === flavor.name && (
                        <div className="mt-2 text-center text-green-600 font-bold">✓ Selected</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Toppings Selection */}
            <div className="mb-12">
              <h3 className="text-3xl text-[#69806C] mb-6 text-center font-['Iceland']">
                Step 2: Select Toppings (Max 3, Optional)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableToppings.map((topping) => (
                  <div
                    key={topping.name}
                    onClick={() => toggleTopping(topping)}
                    className={`cursor-pointer rounded-lg border-2 transition text-center bg-white overflow-hidden relative ${
                      !topping.available ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      selectedToppings.find(t => t.name === topping.name)
                        ? 'border-[#69806C] shadow-lg transform scale-105'
                        : 'border-gray-300 hover:border-[#69806C] hover:shadow-md'
                    }`}
                  >
                    {!topping.available && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-['Iceland']">
                          Out of Stock
                        </span>
                      </div>
                    )}
                    {topping.stock !== undefined && topping.stock <= 10 && topping.available && (
                      <div className="absolute top-1 right-1 bg-yellow-500 text-white px-1 py-0.5 rounded text-xs font-['Iceland'] z-10">
                        {topping.stock} left
                      </div>
                    )}
                    <div className="h-20 relative">
                      <img src={topping.image} alt={topping.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <h4 className="text-lg font-['Iceland']" style={{ color: topping.textColor }}>
                        {topping.name}
                      </h4>
                      {selectedToppings.find(t => t.name === topping.name) && (
                        <div className="mt-1 text-green-600 font-bold">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div className="mb-8">
              <label className="block text-[#69806C] text-lg font-['Iceland'] mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full p-3 border-2 border-gray-300 rounded-lg font-['Iceland']"
                placeholder="Any special requests..."
              />
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">Order Summary</h3>
              <div className="space-y-2 text-lg font-['Iceland']">
                <p>Size: <span className="font-bold">{cupSize}</span></p>
                <p>Flavor: <span className="font-bold">{selectedFlavor?.name || 'Not selected'}</span></p>
                <p>Toppings: <span className="font-bold">
                  {selectedToppings.length > 0 ? selectedToppings.map(t => t.name).join(', ') : 'None'}
                </span></p>
                <div className="border-t pt-2 mt-2">
                  <p className="text-2xl text-[#69806C] font-bold">Total: ฿{calculateTotal()}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Link href="/home">
                <button className="px-6 py-3 bg-gray-400 text-white text-xl font-['Iceland'] rounded-lg hover:bg-gray-500 transition">
                  Cancel
                </button>
              </Link>
              <button
                onClick={handleCreateOrder}
                disabled={loading || !selectedFlavor}
                className="px-8 py-3 bg-[#69806C] text-white text-xl font-['Iceland'] rounded-lg hover:bg-[#5a6e5e] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Confirm Order'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-3xl text-green-600 mb-4 text-center font-['Iceland']">
              ✅ Order Successful!
            </h2>
            <div className="bg-gray-100 p-4 rounded mb-4">
              <p className="text-sm text-gray-600 text-center font-['Iceland']">Customer Code:</p>
              <p className="text-4xl font-bold text-[#69806C] text-center font-['Iceland']">{customerCode}</p>
            </div>
            <p className="text-sm mb-4 text-center font-['Iceland']">
              ⚠️ Save this code to track your order
            </p>
            <button
              onClick={() => router.push('/home')}
              className="w-full bg-[#69806C] text-white py-3 rounded font-['Iceland'] text-lg hover:bg-[#5a6e5e] transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}