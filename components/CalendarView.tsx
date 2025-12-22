import React from 'react';
import { Task, Routine, Status } from '../types';
import { cn, FULL_DAYS, getStatusColor } from '../utils';
import { format, startOfWeek, addDays, isSameDay, parseISO, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarViewProps {
  tasks: Task[];
  routines: Routine[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, routines }) => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  
  // Generate the current week
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Time slots (6 AM to 11 PM)
  const hours = Array.from({ length: 18 }).map((_, i) => i + 6);

  const getItemsForDayAndTime = (date: Date, hour: number) => {
    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');

    // 1. Filter Routines
    const dayRoutines = routines.filter(r => {
        const rStartHour = parseInt(r.startTime.split(':')[0]);
        return r.daysOfWeek.includes(dayOfWeek) && rStartHour === hour;
    });

    // 2. Filter Tasks for this hour
    const dayTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const taskDate = new Date(t.dueDate);
        return isSameDay(taskDate, date) && taskDate.getHours() === hour;
    });

    return { dayRoutines, dayTasks };
  };
  
  // Get tasks that are for this day but might not have a specific time (or we assume "All Day" if time is 00:00, but let's keep it simple: 
  // Tasks without specific time could go here, but with datetime-local they usually have time. 
  // For this logic, let's put any task that matches the day here ONLY if we want them at the top. 
  // But user requested "Option to appear on agenda", implying the grid.
  // So we will only show "All Day" tasks here if their hour is e.g. 0 or undefined, or just keep a summary.
  // Let's keep tasks here only if they are NOT in the grid logic above (e.g. maybe user didn't pick a time?)
  // Actually, standardizing: Show tasks in grid if they have time. Show 'summary' or overdue here?
  // Let's just show tasks here that act as reminders or don't fit the 6am-11pm grid.
  const getTopRowTasks = (date: Date) => {
      return tasks.filter(t => {
          if (!t.dueDate) return false;
          const tDate = new Date(t.dueDate);
          const tHour = tDate.getHours();
          // Show here if it's same day AND (too early OR too late for grid)
          return isSameDay(tDate, date) && (tHour < 6 || tHour >= 24);
      });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-bold capitalize text-gray-800">
            {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
            <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100">Anterior</button>
            <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100">Hoje</button>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100">Próxima</button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Days Header */}
        <div className="flex border-b border-gray-200 min-w-max">
            <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-gray-50 sticky left-0 z-10"></div>
            {weekDays.map(day => (
                <div key={day.toISOString()} className={cn(
                    "flex-1 min-w-[140px] p-2 text-center border-r border-gray-100",
                    isSameDay(day, new Date()) ? "bg-blue-50/50" : "bg-white"
                )}>
                    <div className="text-xs text-gray-500 font-medium uppercase">{format(day, 'EEE', { locale: ptBR })}</div>
                    <div className={cn(
                        "text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1",
                        isSameDay(day, new Date()) ? "bg-blue-600 text-white" : "text-gray-800"
                    )}>
                        {format(day, 'd')}
                    </div>
                </div>
            ))}
        </div>

        {/* Early/Late Tasks Row (Optional visual aid) */}
        <div className="flex border-b border-gray-200 min-w-max bg-gray-50/30">
             <div className="w-16 flex-shrink-0 p-2 text-xs text-gray-400 text-right sticky left-0 bg-gray-50 border-r z-10">Outros</div>
             {weekDays.map(day => {
                 const dayTasks = getTopRowTasks(day);
                 return (
                    <div key={day.toISOString()} className="flex-1 min-w-[140px] p-1 border-r border-gray-100 min-h-[40px]">
                        <div className="flex flex-col gap-1">
                            {dayTasks.map(task => (
                                <div key={task.id} className={cn(
                                    "text-xs p-1.5 rounded border truncate shadow-sm",
                                    task.status === Status.DONE ? "bg-gray-100 text-gray-500 decoration-slate-400" : "bg-white text-gray-700"
                                )}>
                                    <span className={cn("w-2 h-2 rounded-full inline-block mr-1", 
                                        task.priority === 'Alta' || task.priority === 'Urgente' ? 'bg-red-400' : 'bg-blue-400'
                                    )}></span>
                                    {task.title}
                                </div>
                            ))}
                        </div>
                    </div>
                 );
             })}
        </div>

        {/* Time Grid */}
        <div className="min-w-max">
            {hours.map(hour => (
                <div key={hour} className="flex h-24 border-b border-gray-100">
                    <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-gray-50 text-xs text-gray-400 p-2 text-right sticky left-0 z-10">
                        {hour}:00
                    </div>
                    {weekDays.map(day => {
                        const { dayRoutines, dayTasks } = getItemsForDayAndTime(day, hour);
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                            <div key={day.toISOString()} className={cn(
                                "flex-1 min-w-[140px] border-r border-gray-100 p-1 relative flex flex-col gap-1 overflow-y-auto custom-scrollbar",
                                isToday ? "bg-blue-50/10" : ""
                            )}>
                                {/* Routines */}
                                {dayRoutines.map(routine => (
                                    <div key={routine.id} className="bg-indigo-100 border-l-4 border-indigo-500 text-indigo-900 p-1.5 rounded text-xs shadow-sm flex-shrink-0">
                                        <div className="font-bold">{routine.title}</div>
                                        <div className="opacity-75">{routine.startTime} - {routine.endTime}</div>
                                    </div>
                                ))}

                                {/* Tasks */}
                                {dayTasks.map(task => (
                                    <div key={task.id} className={cn(
                                        "border-l-4 p-1.5 rounded text-xs shadow-sm flex-shrink-0 transition-opacity",
                                        task.status === Status.DONE ? "bg-slate-100 border-slate-400 text-slate-500 opacity-60" : "bg-emerald-50 border-emerald-500 text-emerald-900"
                                    )}>
                                        <div className="font-bold truncate">{task.title}</div>
                                        <div className="opacity-75 flex items-center justify-between">
                                            <span>{format(new Date(task.dueDate!), 'HH:mm')}</span>
                                            <span className="text-[10px] uppercase font-bold tracking-wider">{task.priority}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};