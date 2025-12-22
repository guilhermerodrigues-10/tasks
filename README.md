# FlowState - Sistema de Produtividade Pessoal

Sistema completo de produtividade com gerenciamento de tarefas (Kanban), rotinas, agenda e finanças.

## 🚀 Deploy no Portainer

### Opção 1: Via Variáveis de Ambiente (Recomendado)

1. **Configure seu projeto Supabase**:
   - Acesse [https://app.supabase.com](https://app.supabase.com)
   - Crie um novo projeto ou use um existente
   - Vá em **Project Settings** → **API**
   - Copie a **Project URL** e a **anon/public key**

2. **No Portainer**:
   - Vá em **Stacks** → **Add stack**
   - Nome: `flowstate`
   - Build method: **Repository**
   - Repository URL: `https://github.com/guilhermerodrigues-10/tasks`
   - Compose path: `docker-compose.yml`

3. **Configure as variáveis de ambiente**:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

4. **Deploy!**

### Opção 2: Configuração via Interface (Sem variáveis de ambiente)

Se você não quiser configurar as variáveis de ambiente no Portainer:

1. Faça o deploy normalmente (sem definir as variáveis)
2. Acesse a aplicação em `http://seu-servidor:3000`
3. Na tela de login, clique em **"Configurar API"** (ícone de engrenagem)
4. Insira a URL e a chave do Supabase
5. Clique em **"Salvar e Recarregar"**

As configurações serão salvas no navegador (LocalStorage).

## 🔧 Desenvolvimento Local

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/guilhermerodrigues-10/tasks.git
cd tasks
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env com suas credenciais do Supabase
```

4. Execute em modo desenvolvimento:
```bash
npm run dev
```

Acesse: `http://localhost:3000`

### Build para produção

```bash
npm run build
```

Os arquivos compilados estarão em `dist/`.

## 🐳 Docker Local

### Build da imagem:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://seu-projeto.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=sua-chave \
  -t flowstate-app .
```

### Executar container:

```bash
docker run -d -p 3000:80 --name flowstate flowstate-app
```

### Com Docker Compose:

```bash
# Configure as variáveis no .env
cp .env.example .env
# Edite o .env

# Build e execute
docker-compose up -d
```

## 📋 Configuração do Banco de Dados (Supabase)

Execute os seguintes comandos SQL no Supabase SQL Editor para criar as tabelas necessárias:

```sql
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

-- Habilitar RLS (Row Level Security)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (usuário só acessa seus próprios dados)
CREATE POLICY "Users can CRUD their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own routines" ON routines
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own accounts" ON accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);
```

## 🌟 Funcionalidades

- ✅ **Quadro Kanban**: Gerencie tarefas em colunas (Backlog, To Do, In Progress, Done)
- 📅 **Agenda Semanal**: Visualize tarefas e rotinas em formato de calendário
- 🔄 **Gestão de Rotinas**: Crie hábitos recorrentes com tracking de sequência
- 💰 **Controle Financeiro**: Gerencie contas, cartões, transações e metas
- 📊 **Dashboard**: Estatísticas e gráficos de produtividade
- 🔐 **Autenticação**: Sistema completo de login/cadastro via Supabase
- 📱 **Responsivo**: Interface adaptada para mobile e desktop

## 📦 Tecnologias

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build**: Vite
- **Backend**: Supabase (Auth + Database)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Drag & Drop**: dnd-kit
- **Deploy**: Docker + Nginx

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) habilitado
- Proteção de rotas
- Dados isolados por usuário

## 📄 Licença

MIT

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.
