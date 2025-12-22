import { createClient } from '@supabase/supabase-js';

// Função segura para tentar ler variáveis de ambiente (evita erro se import.meta.env não existir)
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return import.meta.env?.[key];
  } catch {
    return undefined;
  }
};

// Prioridade: 1. LocalStorage (configurado na UI) -> 2. Variável de Ambiente -> 3. String Vazia
const supabaseUrl = localStorage.getItem('sb_url') || getEnv('VITE_SUPABASE_URL') || '';
const supabaseKey = localStorage.getItem('sb_key') || getEnv('VITE_SUPABASE_ANON_KEY') || '';

// Inicializa o cliente. Se as strings estiverem vazias, a conexão falhará, mas o app não quebra.
// O usuário poderá corrigir isso na tela de Login.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder-key'
);