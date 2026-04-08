import { Plus } from 'lucide-react';

export default function DashboardHome() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="space-y-8">
          
          {/* Assigned Task Widget */}
          <div className="bg-[#f8f9fa] rounded-[30px] p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 ml-2">Assigned Task</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-1">
                  <h4 className="font-bold text-gray-800">Out of Epic MLBB</h4>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="text-gray-600">Solo rank mlbb</span>
                    <span className="text-[#4CAF50]">Due 20 dec 2052</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* People Widget */}
          <div className="bg-white rounded-[30px] p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 ml-2">People</h3>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-[#ffcda3] rounded-full overflow-hidden mb-2">
                    {/* Placeholder Avatar */}
                    <div className="w-full h-full bg-orange-200 flex items-center justify-center text-xl">👤</div>
                  </div>
                  <p className="font-bold text-xs text-gray-800">Phet</p>
                  <p className="text-[9px] text-gray-500 overflow-hidden text-ellipsis w-full">sadwafsaf@gmail.com</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Project Widget */}
          <div className="bg-white rounded-[30px] p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 ml-2">Project</h3>
            <div className="space-y-3">
              <button className="w-full bg-[#f8f9fa] hover:bg-gray-100 transition-colors p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-gray-800">
                <Plus className="w-5 h-5" />
                New Project
              </button>
              
              {[1, 2].map((i) => (
                <div key={i} className="bg-[#f8f9fa] p-3 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#ffcda3] rounded-full overflow-hidden flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">Out of Epic MLBB</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Private Notepad Widget */}
          <div className="bg-[#f8f9fa] rounded-[30px] p-6 shadow-sm border border-gray-100 h-[380px] flex flex-col">
            <h3 className="font-bold text-lg mb-4 ml-2">Private Notepad</h3>
            <textarea 
              className="w-full flex-1 bg-[#e9ecef] rounded-2xl p-4 resize-none outline-none text-sm text-gray-700 placeholder-gray-400"
              placeholder="where down anything here"
            ></textarea>
          </div>

        </div>
      </div>
    </div>
  );
}
