import Link from 'next/link';
import { Triangle } from 'lucide-react';

export default function LoginPage() {
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

        <form className="w-full space-y-6">
          <div>
            <input 
              type="email" 
              placeholder="Email address"
              className="w-full border border-gray-300 rounded-full px-6 py-4 outline-none focus:border-[#5EE1CD] transition-colors"
            />
          </div>
          
          <div>
            <input 
              type="password" 
              placeholder="Password"
              className="w-full border border-gray-300 rounded-full px-6 py-4 outline-none focus:border-[#5EE1CD] transition-colors"
            />
          </div>

          <button 
            type="button"
            className="w-full bg-[#5EE1CD] text-white font-bold text-xl rounded-full py-4 mt-8 hover:bg-[#4bc7b4] transition-colors shadow-lg shadow-[#5EE1CD]/30"
          >
            LOGIN
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
