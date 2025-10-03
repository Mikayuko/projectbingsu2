// src/pages/login/index.tsx

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { api } from '@/utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login(email, password);

      console.log('Login result:' , result);
      console.log('User points:' , result.user.loyaltyPoints);
       router.push('/home');
      
      // Redirect based on role
      if (result.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-black to-[#273028]">
      <div className="relative w-full max-w-[767px] h-[600px] flex shadow-lg">
        {/* Left Image */}
        <div className="relative w-[267px] h-full border-l-[3px] border-white/50">
          <Image
            src="/images/IMG_2401.png"
            alt="login"
            layout="fill"
            objectFit="cover"
          />
        </div>

        {/* Right Glass Background */}
        <div className="relative w-[500px] h-full bg-white/30 border-[3px] border-l-0 border-white backdrop-blur-[2px] opacity-20" />

        {/* Foreground Content */}
        <div className="absolute right-0 top-0 w-[500px] h-full flex flex-col items-center justify-start px-6 pt-6">
          <h1 className="text-[64px] md:text-[96px] lg:text-[128px] text-white/50 font-['Iceland'] leading-none drop-shadow-md mb-8">
            Log in
          </h1>
          
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 text-white font-['Iceland'] w-[300px]">
            {error && (
              <div className="w-full p-2 bg-red-500/20 border border-red-500 text-red-200 text-sm rounded">
                {error}
              </div>
            )}

            <div className="w-full">
              <label className="text-sm text-white/50">Email</label>
              <input
                type="email"
                className="w-full bg-transparent border-b border-white/50 focus:outline-none text-white mt-1 p-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="w-full">
              <label className="text-sm text-white/50">Password</label>
              <input
                type="password"
                className="w-full bg-transparent border-b border-white/50 focus:outline-none text-white mt-1 p-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 h-9 bg-white/20 border border-white/50 text-white text-lg drop-shadow transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="text-xs text-white/50 mt-4">
              Don't have an account?{' '}
              <Link href="/signup">
                <span className="text-[#FF0101] cursor-pointer hover:underline">Sign up</span>
              </Link>
            </p>

            {/* Demo accounts info */}
            <div className="mt-6 p-3 bg-white/10 rounded text-xs text-white/70">
              <p className="font-bold mb-2">Demo Accounts:</p>
              <p>Admin: admin@bingsu.com / admin123</p>
              <p>User: user@bingsu.com / user123</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}