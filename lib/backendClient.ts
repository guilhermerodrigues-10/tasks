import type { Session } from '@supabase/supabase-js';

// Backend API Client - Compatible with Supabase interface
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return import.meta.env?.[key];
  } catch {
    return undefined;
  }
};

// Em produção, use o nome do serviço Docker (backend)
// Em desenvolvimento local, use localhost:3001
const API_URL = getEnv('VITE_API_URL') || (typeof window !== 'undefined' && window.location.origin.includes('loopmind.cloud')
  ? '/api'  // Produção: proxy via nginx
  : 'http://localhost:3001'); // Desenvolvimento local

// Supabase-compatible client that proxies to backend
export const createBackendClient = () => {
  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  };

  const setToken = (token: string | null) => {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  };

  return {
    auth: {
      async getSession() {
        const token = getToken();
        if (!token) {
          return { data: { session: null }, error: null };
        }

        const { data, error } = await this.getUser();
        if (error || !data?.user) {
          return { data: { session: null }, error: error || null };
        }

        const session: Session = {
          access_token: token,
          refresh_token: '',
          expires_in: 0,
          expires_at: 0,
          token_type: 'bearer',
          user: data.user,
        };

        return { data: { session }, error: null };
      },

      async signUp({ email, password }: { email: string; password: string }) {
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.data?.session?.access_token) {
          setToken(data.data.session.access_token);
        }

        return data;
      },

      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const response = await fetch(`${API_URL}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.data?.session?.access_token) {
          setToken(data.data.session.access_token);
        }

        return data;
      },

      async signOut() {
        const token = getToken();
        if (token) {
          await fetch(`${API_URL}/auth/signout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        }
        setToken(null);
        return { error: null };
      },

      async getUser() {
        const token = getToken();
        if (!token) {
          return { data: { user: null }, error: null };
        }

        try {
          const response = await fetch(`${API_URL}/auth/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();
          return { data, error: null };
        } catch (error: any) {
          setToken(null);
          return { data: { user: null }, error };
        }
      },

      onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        // Simulate auth state check on mount
        const token = getToken();
        if (token) {
          this.getUser().then(({ data }) => {
            if (data.user) {
              callback('SIGNED_IN', { access_token: token, user: data.user });
            } else {
              callback('SIGNED_OUT', null);
            }
          });
        } else {
          callback('SIGNED_OUT', null);
        }

        return {
          data: { subscription: { unsubscribe: () => {} } },
        };
      },
    },

    from(table: string) {
      const token = getToken();

      return {
        async select(columns = '*') {
          const response = await fetch(`${API_URL}/data/${table}`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });

          const result = await response.json();
          return {
            data: result.data || [],
            error: result.error || null,
          };
        },

        async insert(payload: any) {
          const response = await fetch(`${API_URL}/data/${table}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(payload),
          });

          const result = await response.json();
          return {
            data: result.data || null,
            error: result.error || null,
          };
        },

        update(payload: any) {
          return {
            async eq(column: string, value: any) {
              const response = await fetch(`${API_URL}/data/${table}/${value}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify(payload),
              });

              const result = await response.json();
              return {
                data: result.data || null,
                error: result.error || null,
              };
            },
          };
        },

        delete() {
          return {
            async eq(column: string, value: any) {
              const response = await fetch(`${API_URL}/data/${table}/${value}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': token ? `Bearer ${token}` : '',
                },
              });

              const result = await response.json();
              return {
                data: result.data || null,
                error: result.error || null,
              };
            },
          };
        },
      };
    },
  };
};

// Export singleton instance
export const backend = createBackendClient();
