import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInCalendarDays, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Updated to use UUIDs for better database compatibility
export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Baixa': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Média': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Alta': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Urgente': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'Backlog': return 'bg-slate-100 text-slate-600';
        case 'A Fazer': return 'bg-blue-50 text-blue-600';
        case 'Em Andamento': return 'bg-purple-50 text-purple-600';
        case 'Concluído': return 'bg-emerald-50 text-emerald-600';
        default: return 'bg-gray-100';
    }
}

export const calculateStreak = (history: string[]): number => {
    if (!history || history.length === 0) return 0;
    
    // Sort unique dates descending
    const sorted = [...new Set(history)].sort((a, b) => b.localeCompare(a));
    
    const today = new Date();
    let streak = 0;
    
    // Check if the most recent completion was today or yesterday
    const lastCompletion = parseISO(sorted[0]);
    const diff = differenceInCalendarDays(today, lastCompletion);
    
    if (diff > 1) return 0; // Streak broken if gap is more than 1 day (today-yesterday = 1)

    // Count consecutive days
    for (let i = 0; i < sorted.length; i++) {
        const current = parseISO(sorted[i]);
        if (i === 0) {
            streak++;
            continue;
        }
        const prev = parseISO(sorted[i-1]);
        const gap = differenceInCalendarDays(prev, current);
        
        if (gap === 1) {
            streak++;
        } else if (gap > 1) {
            break; 
        }
        // if gap is 0 (same day duplicate), just continue
    }
    return streak;
};

export const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const FULL_DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];