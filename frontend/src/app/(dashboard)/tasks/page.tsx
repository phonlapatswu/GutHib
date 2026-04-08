export default function TasksPage() {
  const tasks = [
    { id: 1, name: 'Robux Free', project: 'Roblox Hack', assignment: 'Boss swu', dueDate: '12 dec 2052', status: 'In porgress', progress: 40 },
    { id: 2, name: 'Robux Free', project: 'Roblox Hack', assignment: 'Boss swu', dueDate: '12 dec 2052', status: 'In porgress', progress: 30 },
    { id: 3, name: 'Robux Free', project: 'Roblox Hack', assignment: 'Boss swu', dueDate: '12 dec 2052', status: 'In porgress', progress: 80 },
    { id: 4, name: 'Robux Free', project: 'Roblox Hack', assignment: 'Boss swu', dueDate: '12 dec 2052', status: 'Done', progress: 100 },
  ];

  return (
    <div className="max-w-7xl mx-auto h-full overflow-hidden bg-[#e5e5e5] rounded-[20px] p-6 shadow-sm">
      <div className="w-full h-full overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-4 border-transparent">
              <th className="py-4 px-4 font-bold text-xs flex items-center gap-3 w-1/4">
                <div className="w-5 h-5 rounded-md border-2 border-gray-400 bg-transparent flex-shrink-0"></div>
                TASK NAME
              </th>
              <th className="py-4 px-4 font-bold text-xs uppercase w-1/6">PROJECT</th>
              <th className="py-4 px-4 font-bold text-xs uppercase w-1/6">Assignment</th>
              <th className="py-4 px-4 font-bold text-xs uppercase w-1/6">Due Date</th>
              <th className="py-4 px-4 font-bold text-xs uppercase w-1/6">Status</th>
              <th className="py-4 px-4 font-bold text-xs uppercase w-1/6">Progress</th>
            </tr>
          </thead>
          <tbody className="space-y-4">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-[#d4d4d4] transition-colors rounded-xl group relative">
                <td className="py-6 px-4 font-bold text-sm flex items-center gap-3">
                  <div className="w-5 h-5 rounded-md border-2 border-gray-500 bg-transparent flex-shrink-0"></div>
                  {task.name}
                </td>
                <td className="py-6 px-4 font-bold text-sm">{task.project}</td>
                <td className="py-6 px-4 font-bold text-sm">{task.assignment}</td>
                <td className="py-6 px-4 font-bold text-sm">{task.dueDate}</td>
                <td className="py-6 px-4">
                  <div className="bg-[#5EE1CD] text-white font-bold text-xs text-center py-2 px-4 rounded-full w-28">
                    {task.status}
                  </div>
                </td>
                <td className="py-6 px-4">
                  <div className="w-32 h-4 bg-[#f1f5f9] rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full rounded-r-full ${task.progress === 100 ? 'bg-[#16a34a]' : 'bg-[#94a3b8]'}`}
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
