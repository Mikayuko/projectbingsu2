// src/pages/signup/index.tsx - Redirect to Login after signup

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { api } from '@/utils/api';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await api.register({
        fullName,
        email,
        password,
        confirmPassword
      });

      console.log('✅ Registration successful:', result);
      
      // ✅ Show success message
      alert('Registration successful!');
      
      // ✅ Redirect to login page
      router.push('/login');
      
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      setError(err.message || 'Registration failed. Email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#273028] to-[#060907]">
      <div className="relative w-full max-w-[767px] h-[650px] flex shadow-lg">
        {/* Left Image Panel */}
        <div className="relative w-[267px] h-full border-l-[3px] border-white/50">
          <Image
            src="/images/IMG_2401.png"
            alt="signup"
            layout="fill"
            objectFit="cover"
          />
        </div>

        {/* Right Glass Panel */}
        <div className="relative w-[500px] h-full bg-white/30 border-[3px] border-l-0 border-white backdrop-blur-[2px] opacity-20" />

        {/* Content */}
        <div className="absolute right-0 top-0 w-[500px] h-full flex flex-col items-center justify-start px-6 pt-6">
          <h1 className="text-[64px] md:text-[96px] lg:text-[128px] text-white/50 font-['Iceland'] leading-none drop-shadow-md mb-4">
            Sign Up
          </h1>
          
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 text-white font-['Iceland'] w-[300px]">
            {error && (
              <div className="w-full p-2 bg-red-500/20 border border-red-500 text-red-200 text-sm rounded">
                {error}
              </div>
            )}

            <div className="w-full">
              <label className="text-sm text-white/50">Full name</label>
              <input
                type="text"
                className="w-full bg-transparent border-b border-white/50 focus:outline-none text-white mt-1 p-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

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
                minLength={8}
              />
            </div>

            <div className="w-full">
              <label className="text-sm text-white/50">Confirm Password</label>
              <input
                type="password"
                className="w-full bg-transparent border-b border-white/50 focus:outline-none text-white mt-1 p-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 h-9 bg-white/20 border border-white/50 text-white text-lg drop-shadow transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'SIGN UP'}
            </button>

            <p className="text-xs text-white/50 mt-4">
              Already have an account?{' '}
              <Link href="/login">
                <span className="text-[#FF0101] cursor-pointer hover:underline">Log in</span>
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}