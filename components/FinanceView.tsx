import React, { useState } from 'react';
import { Account, Transaction, FinancialGoal, Receivable } from '../types';
import { cn } from '../utils';
import {
  Wallet, TrendingUp, TrendingDown, Plus,
  PiggyBank, CreditCard, ArrowUpRight, ArrowDownRight,
  Filter, Pencil, Trash2, Search, Landmark, Coins, PieChart as PieChartIcon, CalendarClock, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FinanceViewProps {
  accounts: Account[];
  transactions: Transaction[];
  goals: FinancialGoal[];
  receivables: Receivable[];
  onAddTransaction: () => void;
  onAddAccount: () => void;
  onManageAccounts: () => void;
  onAddCreditCard: () => void;
  onAddGoal: () => void;
  onAddReceivable: () => void;
  onEditTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onEditAccount: (a: Account) => void;
  onDeleteAccount: (id: string) => void;
  onEditGoal: (g: FinancialGoal) => void;
  onDeleteGoal: (id: string) => void;
  onEditReceivable: (r: Receivable) => void;
  onDeleteReceivable: (id: string) => void;
  onMarkAsReceived: (receivableId: string, accountId: string) => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

interface TransactionItemProps {
    t: Transaction;
    showAccountName?: boolean;
    account?: Account;
    onEdit: (t: Transaction) => void;
    onDelete: (id: string) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ t, showAccountName = false, account, onEdit, onDelete }) => {
    return (
        <div className="group flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
            <div className="flex-1">
                <div className="font-semibold text-slate-700 text-sm capitalize">{t.description}</div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{t.category}</span>
                    {showAccountName && <span className="text-[10px] text-slate-400 font-medium uppercase">{account?.name}</span>}
                    <span className="text-[10px] text-slate-400">{format(new Date(t.date), 'dd/MM')}</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className={cn("font-bold text-sm", t.type === 'income' ? 'text-emerald-600' : 'text-slate-600')}>
                    {formatCurrency(t.amount)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => onEdit(t)} className="text-slate-400 hover:text-brand-600 p-1"><Pencil size={12}/></button>
                     <button onClick={() => onDelete(t.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={12}/></button>
                </div>
            </div>
        </div>
    );
};

export const FinanceView: React.FC<FinanceViewProps> = ({
  accounts,
  transactions,
  goals,
  receivables,
  onAddTransaction,
  onAddAccount,
  onManageAccounts,
  onAddCreditCard,
  onAddGoal,
  onAddReceivable,
  onEditTransaction,
  onDeleteTransaction,
  onEditAccount,
  onDeleteAccount,
  onEditGoal,
  onDeleteGoal,
  onEditReceivable,
  onDeleteReceivable,
  onMarkAsReceived
}) => {
  
  // --- Calculations ---
  const currentMonth = new Date().getMonth();
  const monthlyTransactions = transactions.filter(t => new Date(t.date).getMonth() === currentMonth);
  
  // 1. Income
  const incomeList = monthlyTransactions.filter(t => t.type === 'income');
  const totalIncome = incomeList.reduce((acc, t) => acc + t.amount, 0);

  // 2. Classification
  const creditCards = accounts.filter(a => a.type === 'credit-card');
  const normalAccounts = accounts.filter(a => a.type !== 'credit-card');

  // Calculate Total Net Worth (Sum of all account balances)
  const totalBalance = accounts.reduce((acc, curr) => {
    const balance = typeof curr.balance === 'number' && !isNaN(curr.balance) ? curr.balance : 0;
    return acc + balance;
  }, 0);

  // Receivables calculations
  const pendingReceivables = receivables.filter(r => !r.received);
  const currentMonthReceivables = pendingReceivables.filter(r => new Date(r.expectedDate).getMonth() === currentMonth);
  const totalPendingReceivables = pendingReceivables.reduce((acc, r) => acc + r.amount, 0);
  const totalCurrentMonthReceivables = currentMonthReceivables.reduce((acc, r) => acc + r.amount, 0);

  // 3. Cash Expenses (Non-Credit Card)
  const cashExpenses = monthlyTransactions.filter(t => 
    t.type === 'expense' && normalAccounts.find(a => a.id === t.accountId)
  );
  const totalCashExpenses = cashExpenses.reduce((acc, t) => acc + t.amount, 0);

  // 4. Total Expenses (Cash + Credit Card)
  const totalExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  // 5. Expense Distribution for Chart
  const expenseCategories = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);
  
  const chartData = Object.keys(expenseCategories).map(cat => ({
      name: cat,
      value: expenseCategories[cat]
  })).sort((a,b) => b.value - a.value);

  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1'];

  const getAccountGradient = (color: string) => {
    const colors: Record<string, string> = {
      'blue': 'from-blue-600 to-blue-800',
      'purple': 'from-purple-600 to-purple-800',
      'emerald': 'from-emerald-600 to-emerald-800',
      'black': 'from-slate-700 to-slate-900',
      'orange': 'from-orange-500 to-red-600',
      'pink': 'from-pink-600 to-rose-700',
    };
    return colors[color] || colors['blue'];
  };

  const getHeaderColor = (name: string, defaultColor: string) => {
      const n = name.toLowerCase();
      if (n.includes('nubank')) return 'bg-[#820ad1]'; // Nu Purple
      if (n.includes('inter')) return 'bg-[#ff7a00]'; // Inter Orange
      if (n.includes('santander')) return 'bg-[#ec0000]';
      if (n.includes('itaú') || n.includes('itau')) return 'bg-[#ec7000]';
      if (n.includes('c6')) return 'bg-slate-800';
      return defaultColor;
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      
      {/* 1. Top Section: Net Worth & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance Card */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-900/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-slate-400 font-medium text-sm mb-1 flex items-center gap-2">
              <Wallet size={16} /> Saldo Líquido
            </p>
            <h2 className="text-4xl font-bold tracking-tight mb-4">{formatCurrency(totalBalance)}</h2>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                 <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                 <div>
                   <p className="text-[10px] text-slate-400 uppercase font-bold">Entradas</p>
                   <p className="text-sm font-semibold text-emerald-400">{formatCurrency(totalIncome)}</p>
                 </div>
               </div>
               <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                 <div className="w-2 h-2 rounded-full bg-red-400"></div>
                 <div>
                   <p className="text-[10px] text-slate-400 uppercase font-bold">Saídas</p>
                   <p className="text-sm font-semibold text-red-400">{formatCurrency(totalExpenses)}</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Goals (Visual only) */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 col-span-1 md:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
                <PiggyBank size={18} className="text-brand-600" />
                <h3 className="font-bold text-slate-800">Metas</h3>
             </div>
             <button onClick={onAddGoal} className="text-xs font-bold text-brand-600 hover:bg-brand-50 px-2 py-1 rounded transition-colors">+ Nova</button>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar flex gap-4 pb-2">
             {goals.map(goal => {
                const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return (
                    <div key={goal.id} className="min-w-[200px] border border-slate-100 bg-slate-50/50 p-3 rounded-xl flex flex-col justify-center relative group">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-sm text-slate-700 truncate">{goal.title}</span>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white shadow-sm p-1 rounded-md">
                                <button onClick={() => onEditGoal(goal)}><Pencil size={10} className="text-slate-400 hover:text-brand-600"/></button>
                            </div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full mb-2 overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                            <span>{formatCurrency(goal.currentAmount)}</span>
                            <span>{percentage}%</span>
                        </div>
                    </div>
                )
             })}
          </div>
        </div>
      </div>

      {/* 2. My Accounts (Simplified Cards - Name & Balance Only) */}
      <div className="space-y-3">
         <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <CreditCard size={18} className="text-slate-400" /> Minhas Contas
            </h3>
            <button onClick={onManageAccounts} className="text-sm font-medium text-brand-600 hover:underline">Gerenciar</button>
         </div>         <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {accounts.map(account => {
                const isCredit = account.type === 'credit-card';
                return (
                    <div
                        key={account.id}
                        className={cn(
                            "group min-w-[240px] h-28 rounded-2xl p-5 text-white flex flex-col justify-between shadow-lg relative overflow-hidden bg-gradient-to-br hover:scale-[1.02] transition-transform",
                            getAccountGradient(account.color)
                        )}
                    >
                        <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                        {/* Action Buttons */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditAccount(account);
                                }}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                title="Editar conta"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Tem certeza que deseja excluir a conta "${account.name}"?`)) {
                                        onDeleteAccount(account.id);
                                    }
                                }}
                                className="p-1.5 hover:bg-red-500/30 rounded-lg transition-colors"
                                title="Deletar conta"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h4 className="font-bold text-lg">{account.name}</h4>
                                <p className="text-[10px] opacity-80 uppercase tracking-wider font-bold">{isCredit ? 'Fatura' : 'Saldo'}</p>
                            </div>
                            {isCredit ? <CreditCard size={20} className="opacity-80"/> : <Landmark size={20} className="opacity-80"/>}
                        </div>
                        <div className="relative z-10">
                            <p className="text-2xl font-bold tracking-tight">{formatCurrency(account.balance)}</p>
                        </div>
                    </div>
                );
            })}
             <button onClick={onAddAccount} className="min-w-[100px] h-28 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-brand-500 hover:border-brand-200 hover:bg-brand-50/10 transition-all gap-2">
                <Plus size={24} />
            </button>
         </div>
      </div>

      {/* 3. Detailed Lists (Spreadsheet Logic) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Column 1: Income & Cash Expenses */}
        <div className="space-y-6">
            
            {/* Ganhos do Mês */}
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
                <div className="bg-sky-600 p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold uppercase text-sm tracking-wide">
                        <ArrowUpRight size={18} /> Ganhos do Mês
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="max-h-96 overflow-y-auto p-2 custom-scrollbar">
                    {incomeList.length > 0 ? (
                        incomeList.map(t => (
                            <TransactionItem 
                                key={t.id} 
                                t={t} 
                                showAccountName 
                                account={accounts.find(a => a.id === t.accountId)} 
                                onEdit={onEditTransaction} 
                                onDelete={onDeleteTransaction} 
                            />
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm">Nenhum ganho registrado.</div>
                    )}
                </div>
            </div>

            {/* A Receber */}
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
                <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold uppercase text-sm tracking-wide">
                        <CalendarClock size={18} /> A Receber (Mês)
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">{formatCurrency(totalCurrentMonthReceivables)}</span>
                        <button onClick={onAddReceivable} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Adicionar">
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
                <div className="max-h-96 overflow-y-auto p-2 custom-scrollbar">
                    {currentMonthReceivables.length > 0 ? (
                        currentMonthReceivables.map(r => (
                            <div key={r.id} className="group flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-700 text-sm">{r.description}</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{r.category}</span>
                                        <span className="text-[10px] text-slate-400">{format(new Date(r.expectedDate), 'dd/MM')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-sm text-emerald-600">{formatCurrency(r.amount)}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                const accountId = prompt('Selecione a conta (cole o nome):');
                                                const account = accounts.find(a => a.name.toLowerCase().includes(accountId?.toLowerCase() || ''));
                                                if (account) {
                                                    onMarkAsReceived(r.id, account.id);
                                                } else {
                                                    alert('Conta não encontrada');
                                                }
                                            }}
                                            className="text-emerald-500 hover:text-emerald-700 p-1"
                                            title="Marcar como recebido"
                                        >
                                            <CheckCircle2 size={14}/>
                                        </button>
                                        <button onClick={() => onEditReceivable(r)} className="text-slate-400 hover:text-brand-600 p-1"><Pencil size={12}/></button>
                                        <button onClick={() => onDeleteReceivable(r.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={12}/></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm">Nenhum valor a receber este mês.</div>
                    )}
                </div>
            </div>

            {/* Gastos Pix/Dinheiro */}
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
                <div className="bg-[#cc3300] p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold uppercase text-sm tracking-wide">
                        <Coins size={18} /> Projeção Gastos (Pix/Dinheiro)
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(totalCashExpenses)}</span>
                </div>
                <div className="max-h-96 overflow-y-auto p-2 custom-scrollbar">
                    {cashExpenses.length > 0 ? (
                        cashExpenses.map(t => (
                            <TransactionItem 
                                key={t.id} 
                                t={t} 
                                account={accounts.find(a => a.id === t.accountId)} 
                                onEdit={onEditTransaction} 
                                onDelete={onDeleteTransaction} 
                            />
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm">Nenhum gasto registrado.</div>
                    )}
                </div>
            </div>

            {/* Chart Section - Expense Distribution */}
            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden p-6 min-h-[300px] flex flex-col">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 flex-shrink-0">
                     <PieChartIcon size={18} className="text-brand-600" /> Distribuição de Gastos
                </h3>
                {chartData.length > 0 ? (
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                        Sem dados de gastos.
                    </div>
                )}
            </div>
        </div>

        {/* Column 2: Credit Cards (One block per card) */}
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <CreditCard size={18} className="text-slate-400" /> Faturas de Cartão
                </h3>
                <button 
                    onClick={onAddCreditCard} 
                    className="text-xs bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1"
                >
                    <Plus size={14} /> Novo Cartão
                </button>
            </div>
            
            {creditCards.map(card => {
                const cardExpenses = monthlyTransactions.filter(t => t.accountId === card.id && t.type === 'expense');
                const invoiceTotal = cardExpenses.reduce((acc, t) => acc + t.amount, 0);
                
                // Dynamic header color based on name (mimicking the spreadsheet colors)
                const headerClass = getHeaderColor(card.name, 'bg-slate-700');

                return (
                    <div key={card.id} className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden group">
                        <div className={cn("p-4 text-white flex justify-between items-center relative", headerClass)}>
                             <div className="flex items-center gap-2 font-bold uppercase text-sm tracking-wide">
                                {card.name}
                            </div>
                             <div className="flex items-center gap-3">
                                <span className="font-bold text-lg">{formatCurrency(invoiceTotal)}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => onEditAccount(card)} className="text-white/70 hover:text-white p-1" title="Editar Cartão"><Pencil size={14}/></button>
                                    <button onClick={() => onDeleteAccount(card.id)} className="text-white/70 hover:text-red-200 p-1" title="Excluir Cartão"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
                             {cardExpenses.length > 0 ? (
                                cardExpenses.map(t => (
                                    <TransactionItem 
                                        key={t.id} 
                                        t={t} 
                                        account={accounts.find(a => a.id === t.accountId)} 
                                        onEdit={onEditTransaction} 
                                        onDelete={onDeleteTransaction} 
                                    />
                                ))
                            ) : (
                                <div className="p-6 text-center text-slate-400 text-sm">Fatura zerada.</div>
                            )}
                        </div>
                    </div>
                )
            })}
             {creditCards.length === 0 && (
                 <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-400">
                     <p className="mb-2">Nenhum cartão de crédito cadastrado.</p>
                     <button onClick={onAddCreditCard} className="text-brand-600 font-bold hover:underline text-sm">Adicionar Cartão</button>
                 </div>
             )}

             {/* Total Expenses Summary (Matching the 'Gastos Totais' in spreadsheet) */}
            <div className="bg-orange-200/50 p-4 rounded-xl border border-orange-200 flex justify-between items-center mt-4">
                <span className="font-bold text-slate-700 text-sm uppercase">Gastos Totais (Projetados)</span>
                <span className="text-xl font-bold text-slate-800">
                    {formatCurrency(totalExpenses)}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};