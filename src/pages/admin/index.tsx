'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import LogoutModal from '@/components/LogoutModal';
import { isAuthenticated, isAdmin, getCurrentUser, api } from '@/utils/api';

export default function AdminPage() {
  const [showLogout, setShowLogout] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      alert('กรุณาเข้าสู่ระบบก่อนเพื่อเข้าถึงหน้า Admin');
      router.push('/login');
      return;
    }

    if (!isAdmin()) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้า Admin\nเฉพาะผู้ดูแลระบบเท่านั้น');
      router.push('/home');
      return;
    }

    // Load user data
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show success message
      alert('ออกจากระบบสำเร็จ!');
      
      // Redirect to home page
      router.push('/home');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear data and redirect even if there's an error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/home');
    }
    
    setShowLogout(false);
  };

  const adminButtons = [
    { text: 'สร้างรหัสโค้ด', href: '/admin/create-code' },
    { text: 'ดูรายการออเดอร์', href: '/admin/orders' },
    { text: 'การจัดการข้อมูล', href: '/admin/data-management' },
    { text: 'รายงานยอดขาย', href: '/admin/sales-report' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#EBE6DE] flex flex-col items-center justify-center">
        <p className="text-2xl text-[#69806C] font-['Iceland']">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#EBE6DE] flex flex-col items-center relative overflow-hidden">
      {/* Header */}
      <div className="w-full h-[100px] bg-[#69806C] flex items-center px-10 justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/home">
            <div className="w-12 h-12 bg-white/20 rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-white/30 transition">
              <span className="text-white text-2xl">{'<'}</span>
            </div>
          </Link>
          <h1 className="text-white text-3xl font-['Iceland']">Admin Panel</h1>
        </div>
        
        <div className="flex items-center gap-4">
          
          <button
            className="text-white text-xl font-['Iceland'] underline hover:text-white/80 transition"
            onClick={() => setShowLogout(true)}
          >
            Log out
          </button>
        </div>
      </div>


      {/* Admin Menu */}
      <div className="mt-16 w-full max-w-4xl px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminButtons.map((btn, idx) => (
          <Link href={btn.href} key={idx}>
            <div className="cursor-pointer w-full h-[100px] bg-[#69806C] rounded-[10px] shadow-[0_5px_20px_rgba(0,0,0,0.25)] text-white text-2xl font-['Iceland'] flex items-center justify-center text-center transition hover:scale-105 hover:bg-[#5a6e5e]">
              {btn.text}
            </div>
          </Link>
        ))}
      </div>

     



      {/* Logout Modal */}
      <LogoutModal
        show={showLogout}
        onCancel={() => setShowLogout(false)}
        onLogout={handleLogout}
      />
    </div>
  );
}