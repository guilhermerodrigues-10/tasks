import { backend } from './backendClient';

// Função segura para tentar ler variáveis de ambiente (evita erro se import.meta.env não existir)
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return import.meta.env?.[key];
  } catch {
    return undefined;
  }
};

// Use backend client instead of direct Supabase connection
// This solves CORS and network blocking issues
export const supabase = backend;

// Export placeholder URL for compatibility
export const supabaseUrl_export = getEnv('VITE_API_URL') || 'http://localhost:3001';
