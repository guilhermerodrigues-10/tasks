import React from 'react';
import { Task, Routine, Status } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { CheckCircle2, TrendingUp, AlertCircle, Calendar, Zap, ListChecks } from 'lucide-react';
import { subDays, format, parseISO } from 'date-fns';
import { cn } from '../utils';

interface DashboardProps {
  tasks: Task[];
  routines: Routine[];
}

const KPICard = ({ title, value, icon: Icon, color, subtext }: any) => {
    const colorStyles: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600'
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 flex flex-col justify-between h-full hover:shadow-card-hover transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-2", colorStyles[color])}>
                    <Icon size={24} />
                </div>
                {subtext && <span className="text-xs font-bold px-2 py-1 bg-slate-50 text-slate-500 rounded-lg">{subtext}</span>}
            </div>
            <div>
                <h3 className="text-4xl font-bold text-slate-800 tracking-tight mb-1">{value}</h3>
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">{title}</p>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ tasks, routines }) => {
  
  // Stats Calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === Status.DONE).length;
  const inProgressTasks = tasks.filter(t => t.status === Status.IN_PROGRESS).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const highPriorityTasks = tasks.filter(t => t.priority === 'Alta' || t.priority === 'Urgente').length;

  const dataStatus = [
    { name: 'Concluído', value: completedTasks, color: '#10b981' },
    { name: 'Em Andamento', value: inProgressTasks, color: '#8b5cf6' },
    { name: 'A Fazer', value: tasks.filter(t => t.status === Status.TODO).length, color: '#3b82f6' },
    { name: 'Backlog', value: tasks.filter(t => t.status === Status.BACKLOG).length, color: '#94a3b8' },
  ];

  // Routine Consistency - Last 7 Days
  const last7Days = Array.from({length: 7}, (_, i) => subDays(new Date(), 6 - i));
  const routineActivityData = last7Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      // Count how many routines were completed on this date
      const count = routines.reduce((acc, r) => acc + (r.completionHistory.includes(dateStr) ? 1 : 0), 0);
      return {
          date: format(date, 'dd/MM'),
          completed: count
      };
  });

  const healthyRoutines = routines.filter(r => r.streak > 3).length;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
        <p className="text-slate-500">Métricas de produtividade e consistência</p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Taxa de Conclusão" value={`${completionRate}%`} icon={TrendingUp} color="blue" subtext="Geral" />
        <KPICard title="Tarefas Pendentes" value={totalTasks - completedTasks} icon={ListChecks} color="orange" subtext="Foco" />
        <KPICard title="Rotinas Ativas" value={routines.length} icon={Zap} color="purple" />
        <KPICard title="Consistência Forte" value={healthyRoutines} icon={CheckCircle2} color="green" subtext="+3 dias" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 h-96 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 flex-shrink-0">
                <span className="w-2 h-6 bg-brand-500 rounded-full"></span>
                Distribuição de Tarefas
            </h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataStatus}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}} 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                            {dataStatus.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 h-96 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 flex-shrink-0">
                 <span className="w-2 h-6 bg-brand-500 rounded-full"></span>
                 Consistência de Hábitos <span className="text-sm font-normal text-slate-400 ml-2">(7 dias)</span>
            </h3>
             <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={routineActivityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}} 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="completed" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} name="Hábitos" />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
      </div>
    </div>
  );
};