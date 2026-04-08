import Link from 'next/link';
import { Triangle } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-end p-4 md:p-12"
      style={{
        backgroundImage: 'url("/shark_bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 flex flex-col items-center mx-auto md:mx-0 md:mr-[10%] border-4 border-[#3B82F6]/30">
        
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-black text-white p-1 rounded-sm w-8 h-8 flex items-center justify-center transform -rotate-45">
            <Triangle className="fill-current w-4 h-4 transform rotate-45" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter">SHARK<br/>TASK</h1>
        </div>

        <h2 className="text-5xl md:text-6xl font-black mb-10 text-center leading-tight">Create<br/>account</h2>

        <form className="w-full space-y-6">
          <div>
            <input 
              type="text" 
              placeholder="Username"
              className="w-full border border-gray-300 rounded-full px-6 py-4 outline-none focus:border-[#5EE1CD] transition-colors"
            />
          </div>
          
          <div>
            <input 
              type="email" 
              placeholder="Email address"
              className="w-full border border-gray-300 rounded-full px-6 py-4 outline-none focus:border-[#5EE1CD] transition-colors"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <input 
                type="password" 
                placeholder="Password"
                className="w-full border border-gray-300 rounded-full px-6 py-4 outline-none focus:border-[#5EE1CD] transition-colors"
              />
            </div>
            <div className="flex-1">
              <input 
                type="password" 
                placeholder="Confirm Password"
                className="w-full border border-gray-300 rounded-full px-6 py-4 outline-none focus:border-[#5EE1CD] transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button 
              type="button"
              className="w-full md:w-auto px-12 bg-[#5EE1CD] text-white font-bold text-xl rounded-full py-4 hover:bg-[#4bc7b4] transition-colors shadow-lg shadow-[#5EE1CD]/30"
            >
              Register
            </button>
          </div>
        </form>

        <p className="mt-12 text-xs text-black text-center font-bold">
          Creating an account means you're okay with our <a href="#" className="text-[#5EE1CD] hover:underline font-normal">Terms of Service</a> and <a href="#" className="text-red-400 hover:underline font-normal">Privacy Policy</a>
        </p>
        
        <p className="mt-4 text-xs text-center font-medium">
          Already have an account? <Link href="/login" className="text-[#3B82F6] font-bold hover:underline">Login back</Link>
        </p>

      </div>
    </div>
  );
}
