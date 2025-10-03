// src/pages/index.tsx
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#EBE6DE] text-[#543429] px-4">
      <h1 className="text-4xl md:text-5xl font-['Iceland'] mb-6 text-center">
        Welcome to Bingsu Ordering System
      </h1>
      <p className="text-lg md:text-xl text-center mb-8 max-w-md font-['Iceland']">
        สั่งบิงซู เลือกท็อปปิ้ง สะสมแต้ม และติดตามสถานะได้ง่ายในที่เดียว!
      </p>
      <Link href="/home">
        <button className="px-6 py-3 bg-[#69806C] text-white rounded-lg shadow-lg font-['Iceland'] hover:bg-[#5a6e5e] transition">
          เริ่มใช้งาน
        </button>
      </Link>
    </div>
  );
}