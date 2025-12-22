import React, { useState } from 'react';
import { Routine } from '../types';
import { cn, FULL_DAYS } from '../utils';
import { Plus, ChevronLeft, ChevronRight, Check, Clock, Flame } from 'lucide-react';
import { addDays, format, startOfWeek, subDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RoutineListProps {
  routines: Routine[];
  onToggleRoutine: (routineId: string, date: string) => void;
  onAddRoutine: () => void;
  onDeleteRoutine: (id: string) => void;
}

export const RoutineList: React.FC<RoutineListProps> = ({ routines, onToggleRoutine, onAddRoutine, onDeleteRoutine }) => {
  const [startDate, setStartDate] = useState(subDays(new Date(), 2)); // Start view from 2 days ago by default

  // Generate 5 days to show in the view
  const daysToShow = Array.from({ length: 5 }).map((_, i) => addDays(startDate, i));

  const sortedRoutines = [...routines].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handlePrev = () => setStartDate(prev => subDays(prev, 1));
  const handleNext = () => setStartDate(prev => addDays(prev, 1));

  return (
    <div className="flex flex-col h-full space-y-6">
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl shadow-soft border border-slate-100 flex-shrink-0 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tracker de Hábitos</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Construa disciplina, um dia de cada vez.</p>
            </div>
            <div className="flex items-center gap-4">
                 <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                    <button onClick={handlePrev} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-brand-600">
                        <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => setStartDate(subDays(new Date(), 2))} className="px-4 text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">
                        Hoje
                    </button>
                    <button onClick={handleNext} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-brand-600">
                        <ChevronRight size={18} />
                    </button>
                 </div>
                <button 
                    onClick={onAddRoutine}
                    className="hidden md:flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl transition-all font-medium text-sm shadow-lg shadow-slate-900/20 active:scale-95"
                >
                    <Plus size={18} />
                    Novo Hábito
                </button>
            </div>
        </div>

        {/* Horizontal Scroll Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
           <div className="flex gap-6 h-full min-w-max px-1">
               {daysToShow.map(date => {
                   const dateStr = format(date, 'yyyy-MM-dd');
                   const dayOfWeek = date.getDay();
                   const isToday = isSameDay(date, new Date());
                   
                   // Filter routines that should happen on this day of the week
                   const activeRoutines = sortedRoutines.filter(r => r.daysOfWeek.includes(dayOfWeek));

                   return (
                       <div key={dateStr} className={cn(
                           "w-80 flex flex-col rounded-2xl border transition-all duration-300 h-full overflow-hidden",
                           isToday 
                                ? "bg-white border-brand-200 shadow-xl shadow-brand-500/10 ring-1 ring-brand-100" 
                                : "bg-white/60 border-slate-200"
                       )}>
                           {/* Day Header */}
                           <div className={cn(
                               "p-5 border-b flex items-center justify-between backdrop-blur-sm",
                               isToday ? "bg-brand-50/50 border-brand-100" : "bg-slate-50/50 border-slate-100"
                           )}>
                               <div className="flex items-center gap-3">
                                   <div className={cn(
                                       "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm",
                                       isToday ? "bg-brand-500 text-white" : "bg-white text-slate-700 border border-slate-200"
                                   )}>
                                       {format(date, 'd')}
                                   </div>
                                   <div className="flex flex-col">
                                       <span className={cn("text-sm font-bold uppercase tracking-wide", isToday ? "text-brand-700" : "text-slate-700")}>
                                           {isToday ? "Hoje" : format(date, 'EEEE', { locale: ptBR })}
                                       </span>
                                       <span className="text-xs text-slate-400 capitalize">
                                           {format(date, 'MMMM', { locale: ptBR })}
                                       </span>
                                   </div>
                               </div>
                           </div>

                           {/* Habits List */}
                           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                               {activeRoutines.length > 0 ? (
                                   activeRoutines.map(routine => {
                                       const isCompleted = routine.completionHistory?.includes(dateStr);
                                       
                                       return (
                                           <div 
                                               key={routine.id}
                                               onClick={() => onToggleRoutine(routine.id, dateStr)}
                                               className={cn(
                                                   "group relative p-3.5 rounded-xl cursor-pointer transition-all duration-200 border",
                                                   isCompleted 
                                                        ? "bg-slate-50 border-slate-200" 
                                                        : "bg-white border-slate-100 hover:border-brand-300 hover:shadow-md"
                                               )}
                                           >
                                                <div className="flex items-start gap-3">
                                                   {/* Checkbox */}
                                                   <div className={cn(
                                                       "w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-300 border",
                                                       isCompleted 
                                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/30" 
                                                            : "bg-white border-slate-300 text-transparent group-hover:border-brand-400"
                                                   )}>
                                                       <Check size={14} strokeWidth={4} />
                                                   </div>

                                                   <div className="flex-1 min-w-0">
                                                       <p className={cn(
                                                           "text-sm font-semibold transition-colors leading-tight",
                                                           isCompleted ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700"
                                                       )}>
                                                           {routine.title}
                                                       </p>
                                                       
                                                       <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium border border-slate-200">
                                                               {routine.category}
                                                           </span>
                                                           
                                                            <span className={cn("text-[10px] flex items-center gap-1", isCompleted ? "text-slate-400" : "text-slate-400")}>
                                                                <Clock size={10} /> {routine.startTime}-{routine.endTime}
                                                           </span>
                                                       </div>
                                                   </div>
                                                </div>
                                                
                                                {/* Streak Badge Absolute */}
                                                {routine.streak > 0 && (
                                                    <div className="absolute top-3 right-3 flex items-center gap-0.5 text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">
                                                        <Flame size={10} fill="currentColor" /> {routine.streak}
                                                    </div>
                                                )}
                                           </div>
                                       );
                                   })
                               ) : (
                                   <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                       <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                                            <Check size={20} className="text-slate-400" />
                                       </div>
                                       <span className="text-sm text-slate-500 font-medium">Livre</span>
                                   </div>
                               )}
                           </div>
                       </div>
                   );
               })}
           </div>
        </div>
    </div>
  );
};