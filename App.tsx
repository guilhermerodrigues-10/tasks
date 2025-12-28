import React, { useState, useEffect } from 'react';
import { Layout, Calendar, ListTodo, BarChart3, Plus, Settings, Zap, Wallet, CheckSquare, Loader2, LogOut, RefreshCw } from 'lucide-react';
import { KanbanBoard } from './components/KanbanBoard';
import { RoutineList } from './components/RoutineList';
import { CalendarView } from './components/CalendarView';
import { Dashboard } from './components/Dashboard';
import { FinanceView } from './components/FinanceView';
import { Modal } from './components/Modal';
import { Button } from './components/Button';
import { Auth } from './components/Auth';
import { Task, Routine, ViewMode, Status, Priority, Account, Transaction, FinancialGoal, TransactionType } from './types';
import { generateId, cn, calculateStreak } from './utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

export default function App() {
  // --- AUTH STATE ---
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- DATA STATE ---
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);

  const [view, setView] = useState<ViewMode>('kanban');
  
  // Modals State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  
  // Task Forms
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newTaskStatus, setNewTaskStatus] = useState<Status>(Status.BACKLOG);
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');

  // Routine Forms
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineDays, setNewRoutineDays] = useState<number[]>([]);
  const [newRoutineStart, setNewRoutineStart] = useState('09:00');
  const [newRoutineEnd, setNewRoutineEnd] = useState('10:00');

  // Finance Forms & Edit State
  const [editingTransId, setEditingTransId] = useState<string | null>(null);
  const [transDesc, setTransDesc] = useState('');
  const [transAmount, setTransAmount] = useState('');
  const [transType, setTransType] = useState<TransactionType>('expense');
  const [transCategory, setTransCategory] = useState('');
  const [transAccount, setTransAccount] = useState('');
  const [transDate, setTransDate] = useState('');

  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [accName, setAccName] = useState('');
  const [accBalance, setAccBalance] = useState('');
  const [accColor, setAccColor] = useState('blue');
  const [accType, setAccType] = useState<Account['type']>('checking');
  const [accLimit, setAccLimit] = useState('');

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');

  // --- SUPABASE AUTH & FETCH ---
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*');
      
      if (tasksData) {
          // Map snake_case to camelCase
          const formattedTasks = tasksData.map((t: any) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              priority: t.priority,
              status: t.status,
              dueDate: t.due_date,
              tags: t.tags || [],
              project: t.project,
              routineId: t.routine_id,
              createdAt: t.created_at,
              completedAt: t.completed_at
          }));
          setTasks(formattedTasks);
      }

      // Fetch Routines
      const { data: routinesData } = await supabase.from('routines').select('*');
      if (routinesData) {
          const formattedRoutines = routinesData.map((r: any) => ({
              id: r.id,
              title: r.title,
              daysOfWeek: r.days_of_week,
              startTime: r.start_time,
              endTime: r.end_time,
              category: r.category,
              streak: r.streak,
              completionHistory: r.completion_history || []
          }));
          setRoutines(formattedRoutines);
      }

      // Fetch Accounts
      const { data: accountsData } = await supabase.from('accounts').select('*');
      if (accountsData) {
          setAccounts(accountsData);
      }

      // Fetch Transactions
      const { data: transData } = await supabase.from('transactions').select('*');
      if (transData) {
           const formattedTrans = transData.map((t: any) => ({
               id: t.id,
               accountId: t.account_id,
               amount: t.amount,
               type: t.type,
               category: t.category,
               description: t.description,
               date: t.date
           }));
           setTransactions(formattedTrans);
      }

       // Fetch Goals
       const { data: goalsData } = await supabase.from('goals').select('*');
       if (goalsData) {
           const formattedGoals = goalsData.map((g: any) => ({
               id: g.id,
               title: g.title,
               targetAmount: g.target_amount,
               currentAmount: g.current_amount,
               color: g.color
           }));
           setGoals(formattedGoals);
       }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setTasks([]);
    setRoutines([]);
    setAccounts([]);
    setTransactions([]);
    setGoals([]);
  };

  // --- HANDLERS ---
  
  // Tasks
  const handleMoveTask = async (taskId: string, newStatus: Status) => {
    // Optimistic Update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus, completedAt: newStatus === Status.DONE ? new Date().toISOString() : undefined } : t
    ));

    // Supabase Update
    await supabase.from('tasks').update({ 
        status: newStatus,
        completed_at: newStatus === Status.DONE ? new Date().toISOString() : null
    }).eq('id', taskId);
  };

  const resetTaskForm = () => {
      setEditingTaskId(null);
      setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskPriority(Priority.MEDIUM); 
      setNewTaskDate(''); setNewTaskProject(''); setNewTaskStatus(Status.BACKLOG);
  };

  const handleOpenNewTask = (status: Status = Status.BACKLOG) => {
      resetTaskForm();
      setNewTaskStatus(status);
      setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
      setEditingTaskId(task.id);
      setNewTaskTitle(task.title);
      setNewTaskDesc(task.description || '');
      setNewTaskPriority(task.priority);
      setNewTaskStatus(task.status);
      setNewTaskDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : '');
      setNewTaskProject(task.project || '');
      setIsTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!newTaskTitle.trim()) return;

    const taskPayload = {
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        status: newTaskStatus,
        due_date: newTaskDate || null,
        project: newTaskProject || null,
        tags: [],
        updated_at: new Date().toISOString()
    };

    if (editingTaskId) {
        // Update Local
        setTasks(prev => prev.map(t => t.id === editingTaskId ? {
            ...t,
            ...taskPayload,
            dueDate: taskPayload.due_date || undefined,
            project: taskPayload.project || undefined,
            completedAt: newTaskStatus === Status.DONE && t.status !== Status.DONE ? new Date().toISOString() : t.completedAt
        } : t));
        
        // Update DB
        await supabase.from('tasks').update({
            ...taskPayload,
            completed_at: newTaskStatus === Status.DONE ? new Date().toISOString() : undefined
        }).eq('id', editingTaskId);

    } else {
        const newId = generateId();
        const newTask = {
            id: newId,
            ...taskPayload,
            created_at: new Date().toISOString()
        };
        
        // Optimistic
        setTasks([...tasks, {
             ...newTask,
             dueDate: newTask.due_date || undefined,
             project: newTask.project || undefined,
             completedAt: undefined
        } as any]);

        // Insert DB
        await supabase.from('tasks').insert(newTask);
    }
    
    resetTaskForm();
    setIsTaskModalOpen(false);
  };

  const handleDeleteTask = async (id: string) => {
      if(confirm('Tem certeza que deseja excluir esta tarefa?')) {
          setTasks(prev => prev.filter(t => t.id !== id));
          await supabase.from('tasks').delete().eq('id', id);
      }
  };

  // Routines
  const handleToggleRoutine = async (id: string, date: string) => {
    let updatedRoutine: Routine | undefined;
    
    setRoutines(prev => prev.map(r => {
      if (r.id === id) {
        const history = r.completionHistory || [];
        const exists = history.includes(date);
        const newHistory = exists ? history.filter(d => d !== date) : [...history, date];
        const newStreak = calculateStreak(newHistory);
        
        updatedRoutine = { ...r, completionHistory: newHistory, streak: newStreak };
        return updatedRoutine;
      }
      return r;
    }));

    if (updatedRoutine) {
        await supabase.from('routines').update({
            completion_history: updatedRoutine.completionHistory,
            streak: updatedRoutine.streak
        }).eq('id', id);
    }
  };

  const handleAddRoutine = async () => {
    if (!newRoutineTitle.trim()) return;
    const newId = generateId();
    const routinePayload = {
        id: newId,
        title: newRoutineTitle,
        days_of_week: newRoutineDays.length > 0 ? newRoutineDays : [1,2,3,4,5],
        start_time: newRoutineStart,
        end_time: newRoutineEnd,
        category: 'Geral',
        streak: 0,
        completion_history: []
    };

    setRoutines([...routines, {
        ...routinePayload,
        daysOfWeek: routinePayload.days_of_week,
        startTime: routinePayload.start_time,
        endTime: routinePayload.end_time,
        completionHistory: []
    }]);

    await supabase.from('routines').insert(routinePayload);

    setNewRoutineTitle(''); setNewRoutineDays([]); setIsRoutineModalOpen(false);
  };

  const handleDeleteRoutine = async (id: string) => {
      if(confirm('Tem certeza que deseja remover esta rotina?')) {
          setRoutines(prev => prev.filter(r => r.id !== id));
          await supabase.from('routines').delete().eq('id', id);
      }
  };

  const toggleRoutineDay = (dayIndex: number) => {
      setNewRoutineDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
  };

  // Finance Handlers
  const handleSaveTransaction = async () => {
    if (!transDesc || !transAmount || !transAccount) return;
    const amount = parseFloat(transAmount);
    
    if (editingTransId) {
        // LOGIC FOR EDIT IS COMPLEX DUE TO BALANCE UPDATES.
        
        const payload = {
            account_id: transAccount,
            amount,
            type: transType,
            category: transCategory || 'Geral',
            description: transDesc,
            date: transDate || new Date().toISOString()
        };

        // UI Update
        setTransactions(prev => prev.map(t => t.id === editingTransId ? { ...t, ...payload, accountId: payload.account_id } : t));
        
        // DB Update
        await supabase.from('transactions').update(payload).eq('id', editingTransId);

        // Fetch accounts again to ensure balance integrity
        const { data: accs } = await supabase.from('accounts').select('*');
        if(accs) setAccounts(accs);

    } else {
        const newId = generateId();
        const payload = {
            id: newId,
            account_id: transAccount,
            amount: amount,
            type: transType,
            category: transCategory || 'Geral',
            description: transDesc,
            date: transDate || new Date().toISOString()
        };
        
        setTransactions(prev => [...prev, { ...payload, accountId: payload.account_id }]);
        await supabase.from('transactions').insert(payload);

        // Optimistic Account Balance Update
        setAccounts(prev => prev.map(acc => {
            if (acc.id === transAccount) {
                return {
                    ...acc,
                    balance: transType === 'income' ? acc.balance + amount : acc.balance - amount
                };
            }
            return acc;
        }));
        // Also update account in DB
        const account = accounts.find(a => a.id === transAccount);
        if (account) {
            const newBalance = transType === 'income' ? account.balance + amount : account.balance - amount;
            await supabase.from('accounts').update({ balance: newBalance }).eq('id', transAccount);
        }
    }

    resetTransForm();
    setIsTransModalOpen(false);
  };

  const handleEditTransaction = (t: Transaction) => {
      setEditingTransId(t.id);
      setTransDesc(t.description);
      setTransAmount(t.amount.toString());
      setTransType(t.type);
      setTransCategory(t.category);
      setTransAccount(t.accountId);
      setTransDate(format(new Date(t.date), 'yyyy-MM-dd'));
      setIsTransModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
      if(confirm('Excluir esta transação?')) {
          const trans = transactions.find(t => t.id === id);
          setTransactions(prev => prev.filter(t => t.id !== id));
          
          await supabase.from('transactions').delete().eq('id', id);

          // Revert balance
          if (trans) {
             const account = accounts.find(a => a.id === trans.accountId);
             if (account) {
                 const newBalance = trans.type === 'income' ? account.balance - trans.amount : account.balance + trans.amount;
                 setAccounts(prev => prev.map(a => a.id === trans.accountId ? { ...a, balance: newBalance } : a));
                 await supabase.from('accounts').update({ balance: newBalance }).eq('id', trans.accountId);
             }
          }
      }
  };

  const resetTransForm = () => {
    setEditingTransId(null);
    setTransDesc(''); setTransAmount(''); setTransCategory(''); setTransAccount(''); setTransDate('');
  };

  const handleSaveAccount = async () => {
      if (!accName) return;

      const payload = {
          name: accName,
          balance: parseFloat(accBalance) || 0,
          color: accColor,
          type: accType,
          credit_limit: accType === 'credit-card' ? parseFloat(accLimit) : null
      };

      if (editingAccId) {
          setAccounts(prev => prev.map(a => a.id === editingAccId ? { ...a, ...payload, credit_limit: payload.credit_limit || undefined } : a));
          await supabase.from('accounts').update(payload).eq('id', editingAccId);
      } else {
          const newId = generateId();
          setAccounts(prev => [...prev, { id: newId, ...payload, credit_limit: payload.credit_limit || undefined }]);
          await supabase.from('accounts').insert({ id: newId, ...payload });
      }
      resetAccForm();
      setIsAccountModalOpen(false);
  };

  const handleEditAccount = (a: Account) => {
      setEditingAccId(a.id);
      setAccName(a.name);
      setAccBalance(a.balance.toString());
      setAccColor(a.color);
      setAccType(a.type);
      setAccLimit(a.credit_limit?.toString() || '');
      setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = async (id: string) => {
      if(confirm('Tem certeza que deseja excluir esta conta/cartão?')) {
          setAccounts(prev => prev.filter(a => a.id !== id));
          await supabase.from('accounts').delete().eq('id', id);
      }
  };

  const handleAddCreditCard = () => {
      resetAccForm();
      setAccType('credit-card'); 
      setIsAccountModalOpen(true);
  };

  const resetAccForm = () => {
      setEditingAccId(null);
      setAccName(''); setAccBalance(''); setAccType('checking'); setAccLimit('');
  };

  const handleSaveGoal = async () => {
      if (!goalTitle || !goalTarget) return;

      const payload = {
          title: goalTitle,
          target_amount: parseFloat(goalTarget),
          current_amount: parseFloat(goalCurrent) || 0,
          color: 'blue'
      };

      if (editingGoalId) {
          setGoals(prev => prev.map(g => g.id === editingGoalId ? { ...g, ...payload, targetAmount: payload.target_amount, currentAmount: payload.current_amount } : g));
          await supabase.from('goals').update(payload).eq('id', editingGoalId);
      } else {
          const newId = generateId();
          const newGoal = { id: newId, ...payload, targetAmount: payload.target_amount, currentAmount: payload.current_amount };
          setGoals(prev => [...prev, newGoal]);
          await supabase.from('goals').insert({ id: newId, ...payload });
      }
      resetGoalForm();
      setIsGoalModalOpen(false);
  };

  const handleEditGoal = (g: FinancialGoal) => {
      setEditingGoalId(g.id);
      setGoalTitle(g.title);
      setGoalTarget(g.targetAmount.toString());
      setGoalCurrent(g.currentAmount.toString());
      setIsGoalModalOpen(true);
  };

  const handleDeleteGoal = async (id: string) => {
      if (confirm('Excluir esta meta?')) {
          setGoals(prev => prev.filter(g => g.id !== id));
          await supabase.from('goals').delete().eq('id', id);
      }
  }

  const resetGoalForm = () => {
      setEditingGoalId(null);
      setGoalTitle(''); setGoalTarget(''); setGoalCurrent('');
  };


  const NavButton = ({ icon: Icon, label, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={cn(
            "flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
            active 
                ? "bg-brand-500/10 text-brand-600" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        )}
    >
        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-r-full" />}
        <Icon className={cn("mr-3 transition-colors", active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600")} size={20} strokeWidth={2} /> 
        {label}
    </button>
  );

  // --- RENDERING ---

  if (authLoading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
              <Loader2 className="animate-spin text-brand-600" size={32} />
          </div>
      );
  }

  if (!session) {
      return <Auth />;
  }

  if (loading) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc] gap-4">
              <Loader2 className="animate-spin text-brand-600" size={48} />
              <p className="text-slate-500 font-medium animate-pulse">Sincronizando dados...</p>
          </div>
      )
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white flex flex-col border-r border-slate-100 flex-shrink-0 z-30">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 text-slate-900 font-bold text-2xl tracking-tight mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 text-white">
                <Zap size={20} fill="currentColor" />
            </div>
            FlowState
          </div>
          <p className="text-xs text-slate-400 font-medium ml-1 mt-1">SISTEMA PESSOAL</p>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          <NavButton icon={CheckSquare} label="Tarefas" active={view === 'kanban'} onClick={() => setView('kanban')} />
          <NavButton icon={ListTodo} label="Rotinas" active={view === 'routines'} onClick={() => setView('routines')} />
          <NavButton icon={Calendar} label="Agenda" active={view === 'calendar'} onClick={() => setView('calendar')} />
          <NavButton icon={Wallet} label="Finanças" active={view === 'finances'} onClick={() => setView('finances')} />
          <NavButton icon={BarChart3} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
        </nav>

        <div className="p-6 border-t border-slate-50 space-y-2">
            <div className="px-4 py-2 mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase">Logado como</p>
                <p className="text-sm font-medium text-slate-700 truncate">{session.user.email}</p>
            </div>
           <button className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
               <Settings size={20} className="mr-3 text-slate-400" /> Configurações
           </button>
           <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
           >
               <LogOut size={20} className="mr-3" /> Sair
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#f8fafc]">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 flex-shrink-0 sticky top-0 z-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 capitalize tracking-tight">
                    {view === 'kanban' && 'Quadro de Tarefas'}
                    {view === 'routines' && 'Gestão de Hábitos'}
                    {view === 'calendar' && 'Calendário Semanal'}
                    {view === 'finances' && 'Gestão Financeira'}
                    {view === 'dashboard' && 'Estatísticas'}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                    {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
            </div>
            
            <div className="flex gap-3">
                <Button
                    onClick={handleRefresh}
                    variant="ghost"
                    disabled={refreshing}
                    className="gap-2 rounded-xl"
                    title="Atualizar dados"
                >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Atualizando...' : 'Atualizar'}
                </Button>

                {view === 'kanban' && (
                    <Button onClick={() => handleOpenNewTask()} className="gap-2 rounded-xl shadow-brand-500/20 shadow-lg">
                        <Plus size={18} /> Nova Tarefa
                    </Button>
                )}
                {view === 'routines' && (
                    <Button onClick={() => setIsRoutineModalOpen(true)} className="gap-2 rounded-xl shadow-brand-500/20 shadow-lg">
                        <Plus size={18} /> Nova Rotina
                    </Button>
                )}
                {view === 'finances' && (
                     <Button onClick={() => { resetTransForm(); setIsTransModalOpen(true); }} className="gap-2 rounded-xl shadow-brand-500/20 shadow-lg bg-slate-900 hover:bg-slate-800">
                        <Plus size={18} /> Transação
                    </Button>
                )}
            </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
            <div className="max-w-[1600px] mx-auto h-full">
                {view === 'kanban' && (
                    <KanbanBoard 
                        tasks={tasks} 
                        onMoveTask={handleMoveTask} 
                        onAddTask={handleOpenNewTask}
                        onDeleteTask={handleDeleteTask}
                        onEditTask={handleEditTask}
                    />
                )}
                {view === 'routines' && (
                    <RoutineList 
                        routines={routines} 
                        onToggleRoutine={handleToggleRoutine}
                        onAddRoutine={() => setIsRoutineModalOpen(true)}
                        onDeleteRoutine={handleDeleteRoutine}
                    />
                )}
                {view === 'calendar' && (
                    <CalendarView tasks={tasks} routines={routines} />
                )}
                {view === 'finances' && (
                    <FinanceView 
                        accounts={accounts}
                        transactions={transactions}
                        goals={goals}
                        onAddTransaction={() => { resetTransForm(); setIsTransModalOpen(true); }}
                        onAddAccount={() => { resetAccForm(); setIsAccountModalOpen(true); }}
                        onAddCreditCard={handleAddCreditCard}
                        onAddGoal={() => { resetGoalForm(); setIsGoalModalOpen(true); }}
                        onEditTransaction={handleEditTransaction}
                        onDeleteTransaction={handleDeleteTransaction}
                        onEditAccount={handleEditAccount}
                        onDeleteAccount={handleDeleteAccount}
                        onEditGoal={handleEditGoal}
                        onDeleteGoal={handleDeleteGoal}
                    />
                )}
                {view === 'dashboard' && (
                    <Dashboard tasks={tasks} routines={routines} />
                )}
            </div>
        </div>
      </main>

      {/* --- MODALS --- */}
      {/* TASK MODAL */}
      <Modal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        title={editingTaskId ? "Editar Tarefa" : "Nova Tarefa"}
      >
          <div className="space-y-5">
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Título</label>
                  <input 
                    type="text" 
                    value={newTaskTitle} 
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" 
                    placeholder="O que precisa ser feito?"
                  />
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Descrição</label>
                  <textarea 
                    value={newTaskDesc} 
                    onChange={e => setNewTaskDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none h-24 transition-all resize-none" 
                    placeholder="Detalhes adicionais..."
                  />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Projeto</label>
                    <input 
                        type="text" 
                        value={newTaskProject} 
                        onChange={e => setNewTaskProject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                        placeholder="Ex: Trabalho"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Prioridade</label>
                    <div className="relative">
                        <select 
                            value={newTaskPriority} 
                            onChange={e => setNewTaskPriority(e.target.value as Priority)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 appearance-none focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        >
                            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Prazo (Data e Hora)</label>
                    <input 
                        type="datetime-local"
                        value={newTaskDate}
                        onChange={e => setNewTaskDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select 
                        value={newTaskStatus} 
                        onChange={e => setNewTaskStatus(e.target.value as Status)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 appearance-none focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    >
                        {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-slate-50 mt-4">
                  <Button variant="ghost" onClick={() => setIsTaskModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSaveTask}>{editingTaskId ? "Salvar Alterações" : "Criar Tarefa"}</Button>
              </div>
          </div>
      </Modal>

      {/* ROUTINE MODAL */}
      <Modal 
        isOpen={isRoutineModalOpen} 
        onClose={() => setIsRoutineModalOpen(false)} 
        title="Nova Rotina"
      >
          <div className="space-y-5">
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nome da Rotina</label>
                  <input 
                    type="text" 
                    value={newRoutineTitle} 
                    onChange={e => setNewRoutineTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                    placeholder="Ex: Leitura, Academia"
                  />
              </div>
              <div className="grid grid-cols-2 gap-5">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Início</label>
                      <input type="time" value={newRoutineStart} onChange={e => setNewRoutineStart(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none" />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Fim</label>
                      <input type="time" value={newRoutineEnd} onChange={e => setNewRoutineEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none" />
                  </div>
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Dias da Semana</label>
                  <div className="flex justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {['D','S','T','Q','Q','S','S'].map((day, idx) => (
                          <button
                            key={idx}
                            onClick={() => toggleRoutineDay(idx)}
                            className={cn(
                                "w-9 h-9 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center",
                                newRoutineDays.includes(idx) 
                                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/30 scale-105" 
                                    : "text-slate-400 hover:bg-white hover:shadow-sm hover:text-slate-600"
                            )}
                          >
                              {day}
                          </button>
                      ))}
                  </div>
              </div>
              <div className="pt-6 flex justify-end gap-3 border-t border-slate-50 mt-4">
                  <Button variant="ghost" onClick={() => setIsRoutineModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddRoutine}>Salvar Rotina</Button>
              </div>
          </div>
      </Modal>

      {/* TRANSACTION MODAL */}
      <Modal isOpen={isTransModalOpen} onClose={() => setIsTransModalOpen(false)} title={editingTransId ? "Editar Transação" : "Nova Transação"}>
          <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                  <button onClick={() => setTransType('expense')} className={cn("flex-1 py-2 text-sm font-bold rounded-md transition-all", transType === 'expense' ? "bg-white shadow text-red-600" : "text-slate-500")}>Despesa</button>
                  <button onClick={() => setTransType('income')} className={cn("flex-1 py-2 text-sm font-bold rounded-md transition-all", transType === 'income' ? "bg-white shadow text-emerald-600" : "text-slate-500")}>Receita</button>
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Descrição</label>
                  <input type="text" value={transDesc} onChange={e => setTransDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none" placeholder="Ex: Mercado, Salário" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Valor (R$)</label>
                    <input type="number" value={transAmount} onChange={e => setTransAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none" placeholder="0.00" />
                  </div>
                   <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Categoria</label>
                    <input type="text" value={transCategory} onChange={e => setTransCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none" placeholder="Ex: Alimentação" />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Data</label>
                    <input type="date" value={transDate} onChange={e => setTransDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Conta</label>
                    <select value={transAccount} onChange={e => setTransAccount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none">
                        <option value="">Selecione...</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                  </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsTransModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSaveTransaction} className={cn(transType === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700')}>Salvar</Button>
              </div>
          </div>
      </Modal>

      {/* ACCOUNT MODAL */}
      <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title={editingAccId ? "Editar Conta" : "Nova Conta"}>
          <div className="space-y-4">
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nome da Conta</label>
                  <input type="text" value={accName} onChange={e => setAccName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none" placeholder="Ex: Nubank, Carteira" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipo</label>
                    <select value={accType} onChange={e => setAccType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none">
                        <option value="checking">Conta Corrente</option>
                        <option value="savings">Poupança</option>
                        <option value="investment">Investimento</option>
                        <option value="credit-card">Cartão de Crédito</option>
                        <option value="cash">Dinheiro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cor</label>
                    <select value={accColor} onChange={e => setAccColor(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none">
                        <option value="blue">Azul</option>
                        <option value="purple">Roxo</option>
                        <option value="orange">Laranja</option>
                        <option value="black">Preto</option>
                        <option value="emerald">Verde</option>
                        <option value="pink">Rosa</option>
                    </select>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{accType === 'credit-card' ? 'Fatura Atual' : 'Saldo Inicial'}</label>
                    <input type="number" value={accBalance} onChange={e => setAccBalance(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none" placeholder="0.00" />
                  </div>
                  {accType === 'credit-card' && (
                       <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Limite do Cartão</label>
                        <input type="number" value={accLimit} onChange={e => setAccLimit(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none" placeholder="0.00" />
                      </div>
                  )}
              </div>
              <div className="pt-4 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsAccountModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSaveAccount}>Salvar</Button>
              </div>
          </div>
      </Modal>

      {/* GOAL MODAL */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={editingGoalId ? "Editar Meta" : "Nova Meta"}>
          <div className="space-y-4">
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Objetivo</label>
                  <input type="text" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none" placeholder="Ex: Viagem, Carro Novo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Meta (Valor Total)</label>
                    <input type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Já Guardado</label>
                    <input type="number" value={goalCurrent} onChange={e => setGoalCurrent(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none" placeholder="0.00" />
                  </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsGoalModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSaveGoal}>Salvar Meta</Button>
              </div>
          </div>
      </Modal>

    </div>
  );
}