// src/pages/admin/create-code/index.tsx - MongoDB Only

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { isAuthenticated, isAdmin, api } from '@/utils/api';

export default function CreateCodePage() {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      alert('Please login to access Admin');
      router.push('/login');
      return;
    }

    if (!isAdmin()) {
      alert('Admin access only');
      router.push('/home');
      return;
    }
  }, []);

  const handleConfirm = async () => {
    if (!selectedSize) {
      setError('Please select a cup size');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.generateMenuCode(selectedSize);
      setGeneratedCode(result.code);
      setExpiresAt(new Date(result.expiresAt));
    } catch (err: any) {
      setError(err.message || 'Failed to generate code');
      console.error('Code generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedSize(null);
    setGeneratedCode(null);
    setError('');
    setExpiresAt(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#EBE6DE] flex flex-col items-center">
      {/* Header */}
      <div className="w-full h-[60px] bg-[#69806C] flex items-center px-10 shadow-lg">
        <Link href="/admin">
          <div className="w-12 h-12 bg-[#69806C] rounded-full flex items-center justify-center">
            <span className="text-white text-2xl cursor-pointer">{'<'}</span>
          </div>
        </Link>
      </div>
      
      <h1 className="text-4xl text-[#69806C] mb-10 mt-10 drop-shadow font-['Iceland']">
        Create Code for Bingsu
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded font-['Iceland']">
          {error}
        </div>
      )}

      {/* Cup Size Selector */}
      <div className="w-full max-w-3xl flex flex-col items-center mb-10">
        <h2 className="text-[40px] text-[#69806C] mb-6 font-['Iceland']">Cup Size</h2>
        <div className="flex gap-6">
          {['S', 'M', 'L'].map((size) => (
            <button
              key={size}
              onClick={() => {
                setSelectedSize(size);
                setGeneratedCode(null);
                setError('');
              }}
              disabled={loading}
              className={`w-[100px] h-[100px] flex items-center justify-center rounded shadow-[0_0_20px_rgba(0,0,0,0.25),inset_0_10px_20px_rgba(0,0,0,0.25)] 
              ${selectedSize === size ? 'bg-[#69806C]' : 'bg-[#EBE6DE]'} transition disabled:opacity-50`}
            >
              <span
                className={`text-[96px] leading-none ${
                  selectedSize === size ? 'text-white' : 'text-[#543429]'
                }`}
              >
                {size}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Confirm Button */}
      {selectedSize && !generatedCode && (
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="bg-[#69806C] text-white text-2xl px-10 py-3 rounded-xl shadow-md hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed font-['Iceland']"
        >
          {loading ? 'Generating...' : 'Confirm'}
        </button>
      )}

      {/* Display Generated Code */}
      {generatedCode && (
        <div className="mt-10 text-center">
          <h2 className="text-3xl text-[#543429] mb-4 font-['Iceland']">Customer Code:</h2>
          <div className="text-5xl text-[#947E5A] font-bold tracking-widest bg-white px-6 py-4 rounded-xl shadow-lg font-['Iceland']">
            {generatedCode}
          </div>
          <p className="text-gray-600 mt-4 font-['Iceland']">
            Cup Size: <span className="font-bold text-[#69806C]">{selectedSize}</span>
          </p>
          {expiresAt && (
            <p className="text-sm text-gray-500 mt-2 font-['Iceland']">
              Expires: {expiresAt.toLocaleString('th-TH')}
            </p>
          )}
          
          
          {/* Generate Another Button */}
          <button
            onClick={handleReset}
            className="mt-6 bg-[#947E5A] text-white text-xl px-8 py-3 rounded-xl shadow-md hover:scale-105 transition font-['Iceland']"
          >
            Generate Another Code
          </button>
        </div>
      )}

      
    </div>
  );
}