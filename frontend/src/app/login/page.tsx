"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Triangle } from 'lucide-react';
import Cookies from 'js-cookie';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      const { token } = response.data;
      
      // Store token securely in cookies
      Cookies.set('token', token, { expires: 7 }); // Expires in 7 days
      
      // Redirect to dashboard
      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-end p-4 md:p-12"
      style={{
        backgroundImage: 'url("/shark_bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 flex flex-col items-center mx-auto md:mx-0 md:mr-[10%] border-4 border-[#A855F7]/30">
        
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-black text-white p-1 rounded-sm w-8 h-8 flex items-center justify-center transform -rotate-45">
            <Triangle className="fill-current w-4 h-4 transform rotate-45" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter">SHARK<br/>TASK</h1>
        </div>

        <h2 className="text-6xl font-black mb-12 uppercase">LOGIN</h2>

        <form onSubmit={handleLogin} className="w-full space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <div>
            <input 
              type="text" 
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-full px-6 py-4 outline-none focus:border-[#5EE1CD] transition-colors"
            />
          </div>
          
          <div>
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-full px-6 py-4 outline-none focus:border-[#5EE1CD] transition-colors"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#5EE1CD] text-white font-bold text-xl rounded-full py-4 mt-8 hover:bg-[#4bc7b4] transition-colors shadow-lg shadow-[#5EE1CD]/30 disabled:opacity-70 flex justify-center items-center"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "LOGIN"}
          </button>
        </form>

        <p className="mt-16 text-xs text-gray-500 text-center font-medium">
          By logging in, you agree to our <a href="#" className="text-[#5EE1CD] hover:underline">Terms of Service</a> and <a href="#" className="text-red-400 hover:underline">Privacy Policy</a>
        </p>
        
        <p className="mt-4 text-xs text-center font-medium">
          Don't have an account? <Link href="/register" className="text-[#A855F7] font-bold hover:underline">Register here</Link>
        </p>

      </div>
    </div>
  );
}
