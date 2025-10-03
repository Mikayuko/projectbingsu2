// components/entercode.tsx
'use client';

import { useState } from 'react';

export default function EnterCode() {
  const [menuCode, setMenuCode] = useState('');

  const handleConfirm = () => {
    if (menuCode.trim() === '') {
      alert('Please enter a menu code.');
      return;
    }
    // TODO: Replace with actual logic (e.g., API call or redirect)
    alert(`You entered: ${menuCode}`);
  };

  return (
    <div className="w-full bg-[#947E5A] h-[424px] flex flex-col justify-center items-center gap-8 px-4 mt-10">
      {/* Enter Menu Code Field */}
      <div className="w-[337px] h-[60px] bg-[#EBE6DE] border border-white shadow-[inset_0_10px_20px_rgba(0,0,0,0.25),inset_0_0_20px_white] flex justify-center items-center px-6">
        <input
          type="text"
          placeholder="Enter Menu Code"
          value={menuCode}
          onChange={(e) => setMenuCode(e.target.value)}
          className="w-full bg-transparent outline-none text-[28px] font-['Iceland'] text-[#69806C] placeholder-[#69806C] text-center"
        />
      </div>

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        className="w-[200px] h-[60px] bg-[#EBE6DE] border border-white shadow-[0_10px_20px_rgba(0,0,0,0.25),0_0_20px_rgba(0,0,0,0.25)] flex justify-center items-center transition hover:scale-105"
      >
        <span className="text-[36px] font-['Iceland'] text-[#69806C] leading-[35px]">Confirm</span>
      </button>
    </div>
  );
}