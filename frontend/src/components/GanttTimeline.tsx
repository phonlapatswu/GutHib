"use client";

import React, { useMemo } from 'react';
import { format, addDays, startOfToday, differenceInDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface Task {
  task_id: number;
  title: string;
  status: string;
  priority: string;
  planned_start_date: string | null;
  due_date: string | null;
  assignees: any[];
}

/**
 * GanttTimeline: A custom coordinate-based project timeline rendering engine.
 * Uses date-fns for interval calculation and CSS relative/absolute positioning
 * to map dates to UI grid columns.
 */
export default function GanttTimeline({ tasks }: GanttTimelineProps) {
  const today = startOfToday();
  
  // Calculate date range for the chart
  /**
   * Calculate date range for the chart bounding box.
   * Auto-adjusts view based on the earliest and latest task dates in the project.
   * PERFORMANCE: memoized to prevent expensive re-calculations on every render.
   */
  const { startDate, endDate, daysCount, dateHeader } = useMemo(() => {
    // Collect all unique task dates for range determination
    const allDates = tasks.flatMap(t => [
      t.planned_start_date ? new Date(t.planned_start_date) : null,
      t.due_date ? new Date(t.due_date) : null
    ]).filter(d => d !== null) as Date[];
    
    let start = startOfWeek(today);
    let end = endOfWeek(addDays(today, 14)); // Default fallback: 3 weeks view

    if (allDates.length > 0) {
      const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
      start = startOfWeek(addDays(minDate, -7)); // 1 week buffer at start
      end = endOfWeek(addDays(maxDate, 7));    // 1 week buffer at end
    }

    const interval = eachDayOfInterval({ start, end });
    return {
      startDate: start,
      endDate: end,
      daysCount: interval.length,
      dateHeader: interval
    };
  }, [tasks, today]);

  /**
   * Helper: Calculates day offset relative to chart anchor date
   */
  const getDayOffset = (date: Date) => differenceInDays(date, startDate);
  
  return (
    <div className="flex flex-col h-full bg-[rgb(var(--bg-surface))] rounded-[30px] border-4 border-[rgb(var(--border-main))] overflow-hidden shadow-2xl">
      {/* Header / Legend */}
      <div className="p-6 border-b border-[rgb(var(--border-main))] flex justify-between items-center bg-[rgb(var(--bg-sidebar))]/50">
        <h3 className="font-black text-xl uppercase tracking-widest text-[rgb(var(--text-main))]">Timeline</h3>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[rgb(var(--text-muted))]">
             <div className="w-3 h-3 bg-[#3B82F6] rounded-sm"></div> In Progress
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[rgb(var(--text-muted))]">
             <div className="w-3 h-3 bg-[#5EE1CD] rounded-sm"></div> Completed
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="relative" style={{ minWidth: `${daysCount * 100 + 250}px` }}>
          
          {/* Timeline Grid Header */}
          <div className="sticky top-0 z-20 flex bg-[rgb(var(--bg-sidebar))] border-b border-[rgb(var(--border-main))] shadow-sm">
            <div className="w-[250px] flex-shrink-0 p-4 font-black text-xs uppercase text-[rgb(var(--text-dim))] border-r border-[rgb(var(--border-main))] bg-[rgb(var(--bg-sidebar))]">Task Name</div>
            <div className="flex overflow-hidden">
              {dateHeader.map((date, i) => (
                <div 
                  key={i} 
                  className={`w-[100px] flex-shrink-0 p-4 text-center border-r border-[rgb(var(--border-main))] ${isSameDay(date, today) ? 'bg-[#3B82F6]/10' : ''}`}
                >
                  <p className="text-[10px] font-black uppercase text-[rgb(var(--text-dim))]">{format(date, 'EEE')}</p>
                  <p className={`text-sm font-black ${isSameDay(date, today) ? 'text-[#3B82F6]' : 'text-[rgb(var(--text-main))]'}`}>{format(date, 'd MMM')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Body */}
          <div className="relative">
            {/* Today Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-[#3B82F6] z-10 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ left: `${250 + getDayOffset(today) * 100 + 50}px` }}
            />

            {tasks.map((task) => {
              const start = task.planned_start_date ? new Date(task.planned_start_date) : null;
              const end = task.due_date ? new Date(task.due_date) : null;
              
              const startOffset = start ? getDayOffset(start) : -1;
              const duration = (start && end) ? Math.max(differenceInDays(end, start) + 1, 1) : 1;
              
              return (
                <div key={task.task_id} className="flex border-b border-[rgb(var(--border-main))] hover:bg-[rgb(var(--bg-card))]/50 transition-colors group">
                  <div className="w-[250px] flex-shrink-0 p-4 border-r border-[rgb(var(--border-main))] flex items-center">
                    <span className="font-bold text-sm text-[rgb(var(--text-main))] truncate group-hover:text-[#3B82F6] transition-colors">{task.title}</span>
                  </div>
                  
                  <div className="flex flex-1 relative h-16 items-center overflow-hidden">
                    {/* Background Grid Lines */}
                    {dateHeader.map((_, i) => (
                      <div key={i} className="absolute top-0 bottom-0 border-r border-[rgb(var(--border-main))]/30" style={{ left: `${i * 100}px`, width: '100px' }} />
                    ))}

                    {/* Task Bar */}
                    {start && (
                      <div 
                        className={`absolute h-8 rounded-full shadow-lg flex items-center px-4 transition-all hover:scale-[1.02] cursor-pointer
                          ${task.status === 'Closed' 
                            ? 'bg-gradient-to-r from-[#5EE1CD] to-[#3B82F6] shadow-[#3B82F6]/20' 
                            : 'bg-gradient-to-r from-[#3B82F6] to-[#A855F7] shadow-[#3B82F6]/20'
                          }`}
                        style={{ 
                          left: `${startOffset * 100 + 10}px`, 
                          width: `${duration * 100 - 20}px` 
                        }}
                      >
                        <span className="text-[10px] font-black text-white uppercase truncate drop-shadow-md">
                          {task.status === 'Closed' ? '✓ ' : ''} {task.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
