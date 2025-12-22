-- ====================================
-- FlowState - Database Schema Setup
-- ====================================
-- Execute este SQL no Supabase SQL Editor
-- para criar todas as tabelas necessárias
-- ====================================

-- Tabela de Tarefas
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT,
  status TEXT,
  due_date TIMESTAMP,
  project TEXT,
  tags TEXT[],
  routine_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de Rotinas
CREATE TABLE routines (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  days_of_week INTEGER[],
  start_time TEXT,
  end_time TEXT,
  category TEXT,
  streak INTEGER DEFAULT 0,
  completion_history TEXT[],
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de Contas/Cartões
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0,
  color TEXT,
  type TEXT,
  limit DECIMAL(12,2),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de Transações
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  description TEXT,
  date TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de Metas Financeiras
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  color TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ====================================
-- Habilitar Row Level Security (RLS)
-- ====================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- ====================================
-- Políticas de Acesso (RLS Policies)
-- Cada usuário só acessa seus próprios dados
-- ====================================

-- Tasks Policies
CREATE POLICY "Users can CRUD their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Routines Policies
CREATE POLICY "Users can CRUD their own routines" ON routines
  FOR ALL USING (auth.uid() = user_id);

-- Accounts Policies
CREATE POLICY "Users can CRUD their own accounts" ON accounts
  FOR ALL USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can CRUD their own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- Goals Policies
CREATE POLICY "Users can CRUD their own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);

-- ====================================
-- Fim do Schema Setup
-- ====================================
-- Agora você pode usar o app FlowState!
-- ====================================
