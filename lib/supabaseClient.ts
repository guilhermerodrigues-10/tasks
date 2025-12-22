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

// Função segura para ler localStorage (só funciona no browser)
const getLocalStorage = (key: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
    return null;
  } catch {
    return null;
  }
};

// Prioridade: 1. LocalStorage (configurado na UI) -> 2. Variável de Ambiente -> 3. Placeholder
const supabaseUrl = getLocalStorage('sb_url') || getEnv('VITE_SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseKey = getLocalStorage('sb_key') || getEnv('VITE_SUPABASE_ANON_KEY') || 'placeholder-key';

// Inicializa o cliente. Se as strings estiverem vazias, a conexão falhará, mas o app não quebra.
// O usuário poderá corrigir isso na tela de Login.
export const supabase = createClient(supabaseUrl, supabaseKey);

// Export URL for checking if config is needed
export const supabaseUrl_export = supabaseUrl;
