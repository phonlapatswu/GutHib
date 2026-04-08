import Link from 'next/link';
import { Triangle, ChevronDown } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#f9f9f9] text-gray-900 font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#f9f9f9] border-r border-gray-200 flex flex-col pt-8 pb-4">
        
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 mb-8">
          <div className="bg-black text-white p-1 rounded-sm w-8 h-8 flex items-center justify-center transform -rotate-45">
            <Triangle className="fill-current w-4 h-4 transform rotate-45" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter">SHARK<br/>TASK</h1>
        </div>

        {/* Studio Selector */}
        <div className="px-4 mb-6">
          <button className="w-full bg-[#cbd5e1] hover:bg-[#b0bdcc] text-gray-800 font-semibold py-2 px-4 rounded-md flex items-center justify-between transition-colors">
            Forum Studio
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          {['Home', 'My Task', 'Inbox', 'Message', 'Analytics'].map((item, i) => (
            <Link 
              key={item} 
              href={item === 'Home' ? '/dashboard' : item === 'My Task' ? '/dashboard/tasks' : '#'}
              className={`block px-4 py-2 text-sm font-medium rounded-md ${
                i === 0 ? 'bg-white shadow-sm text-black' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item}
            </Link>
          ))}
          
          <div className="mt-8 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Project
          </div>
          
          {['Project1', 'Project2', 'Project3', 'Project4', 'Project5'].map((project) => (
            <Link 
              key={project} 
              href="#"
              className="block px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
            >
              {project}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>

    </div>
  );
}
