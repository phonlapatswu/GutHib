"use client";

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Target, Zap, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

interface Task {
  task_id: number;
  status: 'Open' | 'In_Progress' | 'Review' | 'Closed';
}

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/users/me/tasks');
        setTasks(res.data);
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-12 h-12 text-[#5EE1CD] animate-spin" />
      </div>
    );
  }

  // Calculate Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Closed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In_Progress').length;
  const openTasks = tasks.filter(t => t.status === 'Open').length;
  const reviewTasks = tasks.filter(t => t.status === 'Review').length;

  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // SVG Configuration
  const sqSize = 250;
  const strokeWidth = 25;
  const radius = (sqSize - strokeWidth) / 2;
  const viewBox = `0 0 ${sqSize} ${sqSize}`;
  const dashArray = radius * Math.PI * 2;
  const dashOffset = dashArray - (dashArray * completionRate) / 100;

  return (
    <div className="max-w-7xl mx-auto h-full p-4 md:p-10 flex flex-col overflow-y-auto custom-scrollbar">
      <header className="mb-12">
        <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-gray-900 border-b-8 border-[#3B82F6] inline-block pb-2">Analytics</h2>
        <p className="font-bold text-gray-500 mt-4 text-lg flex items-center gap-2">
          <TrendingUp className="text-[#3B82F6]" /> Your productivity metrics and performance breakdown.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Total Metric */}
        <div className="bg-white rounded-[40px] p-8 shadow-2xl border-4 border-gray-100 flex flex-col items-center justify-center text-center transform hover:-translate-y-2 transition-transform">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-[#3B82F6]">
            <Target className="w-8 h-8" />
          </div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-2">Total Quests</p>
          <h3 className="text-6xl font-black text-gray-900">{totalTasks}</h3>
        </div>

        {/* Completion Ring */}
        <div className="bg-white rounded-[40px] p-8 shadow-2xl border-4 border-[#5EE1CD]/30 flex flex-col items-center justify-center transform hover:-translate-y-2 transition-transform relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#5EE1CD]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-6 relative z-10">Completion Rate</p>
          
          {/* Custom SVG Ring Chart */}
          <div className="relative z-10 w-[200px] h-[200px] flex items-center justify-center">
            <svg width={sqSize} height={sqSize} viewBox={viewBox} className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                className="text-gray-100"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="none"
                cx={sqSize / 2}
                cy={sqSize / 2}
                r={radius}
              />
              <circle
                className="text-[#5EE1CD] drop-shadow-xl"
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                cx={sqSize / 2}
                cy={sqSize / 2}
                r={radius}
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="text-center absolute">
              <span className="text-5xl font-black text-gray-900">{completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Efficiency Metric */}
        <div className="bg-white rounded-[40px] p-8 shadow-2xl border-4 border-[#A855F7]/10 flex flex-col items-center justify-center text-center transform hover:-translate-y-2 transition-transform">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-[#A855F7]">
            <Zap className="w-8 h-8" />
          </div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-2">Active Action</p>
          <h3 className="text-6xl font-black text-gray-900">{inProgressTasks}</h3>
        </div>
      </div>

      {/* Distribution Bars */}
      <h3 className="font-black text-2xl uppercase text-gray-800 mb-6">Status Breakdown</h3>
      <div className="bg-white rounded-[40px] p-10 shadow-2xl border-4 border-gray-100 flex flex-col gap-8">
        
        {/* Closed */}
        <div className="w-full">
          <div className="flex justify-between mb-2">
            <span className="font-bold text-gray-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#16a34a]" /> Completed</span>
            <span className="font-black text-gray-900">{completedTasks}</span>
          </div>
          <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* In Progress */}
        <div className="w-full">
          <div className="flex justify-between mb-2">
            <span className="font-bold text-gray-700 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div> In Progress</span>
            <span className="font-black text-gray-900">{inProgressTasks}</span>
          </div>
          <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-[#5EE1CD] to-[#3B82F6] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${totalTasks === 0 ? 0 : (inProgressTasks / totalTasks) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Review */}
        <div className="w-full">
          <div className="flex justify-between mb-2">
            <span className="font-bold text-gray-700 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#A855F7]"></div> In Review</span>
            <span className="font-black text-gray-900">{reviewTasks}</span>
          </div>
          <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-[#A855F7] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${totalTasks === 0 ? 0 : (reviewTasks / totalTasks) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Open */}
        <div className="w-full">
           <div className="flex justify-between mb-2">
            <span className="font-bold text-gray-700 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300"></div> Open</span>
            <span className="font-black text-gray-900">{openTasks}</span>
          </div>
          <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gray-300 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${totalTasks === 0 ? 0 : (openTasks / totalTasks) * 100}%` }}
            ></div>
          </div>
        </div>

      </div>

    </div>
  );
}
