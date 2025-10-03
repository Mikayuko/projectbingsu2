'use client';

import React from 'react';

interface LogoutModalProps {
  show: boolean;
  onCancel: () => void;
  onLogout: () => void;
}

export default function LogoutModal({ show, onCancel, onLogout }: LogoutModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="relative w-[500px] h-[370px] bg-gradient-to-b from-[#69806C] to-[#EBE6DE] border border-white/50 shadow-[0_10px_40px_rgba(0,0,0,0.25)] rounded-xl p-6">

        {/* Title */}
        <h1 className="absolute top-14 left-1/2 transform -translate-x-1/2 text-white text-[64px] font-['Iceland'] leading-[62px]">
          Logout
        </h1>

        {/* Subtitle */}
        <p className="absolute top-[134px] left-1/2 transform -translate-x-1/2 text-white text-[36px] font-['Iceland'] text-center">
          Are you sure you want to logout?
        </p>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="absolute left-[80px] top-[253px] w-[145px] h-[60px] bg-[#DBD9D4] border border-white shadow-[0_0_20px_rgba(0,0,0,0.25)]"
        >
          <span className="text-white text-[36px] font-['Iceland'] leading-[35px]">Cancel</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="absolute left-[275px] top-[253px] w-[145px] h-[60px] bg-[#DBD9D4] border border-white shadow-[0_0_20px_rgba(0,0,0,0.25)]"
        >
          <span className="text-[#B51212] text-[36px] font-['Iceland'] leading-[35px]">Logout</span>
        </button>
      </div>
    </div>
  );
}