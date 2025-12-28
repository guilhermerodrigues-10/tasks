import { backend } from './backendClient';

// Use backend client instead of direct Supabase connection
// This solves CORS and network blocking issues
export const supabase = backend;

// Export placeholder URL for compatibility
export const supabaseUrl_export = import.meta.env.VITE_API_URL || 'http://localhost:3001';
