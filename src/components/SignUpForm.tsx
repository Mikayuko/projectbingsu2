'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignUpForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <form className="flex flex-col items-center gap-6 text-white font-['Iceland'] w-[300px]">
      <div className="w-full">
        <label className="text-sm text-white/50">Full name</label>
        <input
          type="text"
          className="w-full bg-transparent border-b border-white/50 focus:outline-none text-white mt-1"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="w-full">
        <label className="text-sm text-white/50">Email</label>
        <input
          type="email"
          className="w-full bg-transparent border-b border-white/50 focus:outline-none text-white mt-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="w-full">
        <label className="text-sm text-white/50">Password</label>
        <input
          type="password"
          className="w-full bg-transparent border-b border-white/50 focus:outline-none text-white mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="w-full">
        <label className="text-sm text-white/50">Confirm Password</label>
        <input
          type="password"
          className="w-full bg-transparent border-b border-white/50 focus:outline-none text-white mt-1"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="w-full mt-4 h-9 bg-white/20 border border-white/50 text-white text-lg drop-shadow transition hover:scale-105"
      >
        SIGN UP
      </button>

      <p className="text-xs text-white/50 mt-4">
        Already have an account?{' '}
        <Link href="/login">
          <span className="text-[#FF0101] cursor-pointer hover:underline">Log in</span>
        </Link>
      </p>
    </form>
  );
}