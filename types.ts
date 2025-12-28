export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  URGENT = 'Urgente'
}

export enum Status {
  BACKLOG = 'Backlog',
  TODO = 'A Fazer',
  IN_PROGRESS = 'Em Andamento',
  DONE = 'Concluído'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  dueDate?: string; // ISO String
  tags: string[];
  project?: string; // Optional project/context field
  routineId?: string; // Link to a routine
  createdAt: string;
  completedAt?: string;
}

export interface Routine {
  id: string;
  title: string;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: string;
  streak: number;
  completionHistory: string[]; // Array of ISO Date strings (YYYY-MM-DD)
}

// Financial Types
export type TransactionType = 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  balance: number;
  color: string; // hex or tailwind class reference
  type: 'checking' | 'savings' | 'investment' | 'cash' | 'credit-card';
  credit_limit?: number; // Only for credit cards
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // ISO String
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
}

export interface Receivable {
  id: string;
  description: string;
  amount: number;
  expectedDate: string; // ISO String
  category: string;
  received: boolean;
  receivedDate?: string; // ISO String - when it was actually received
  accountId?: string; // Account where it was deposited when received
}

export type ViewMode = 'kanban' | 'routines' | 'calendar' | 'dashboard' | 'finances';

export const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  gray: '#64748b'
};