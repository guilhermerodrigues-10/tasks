// API Client for FlowState Backend
const API_URL = import.meta.env.VITE_API_URL || '/api';

interface AuthResponse {
  data?: {
    user: any;
    session: any;
  };
  error?: string;
}

interface DataResponse<T> {
  data?: T;
  error?: string;
}

class APIClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth methods
  async signUp(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.data?.session?.access_token) {
      this.token = data.data.session.access_token;
      localStorage.setItem('access_token', this.token);
    }

    return data;
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.data?.session?.access_token) {
      this.token = data.data.session.access_token;
      localStorage.setItem('access_token', this.token);
    }

    return data;
  }

  async signOut(): Promise<void> {
    await this.request('/auth/signout', { method: 'POST' });
    this.token = null;
    localStorage.removeItem('access_token');
  }

  async getUser(): Promise<{ user: any } | null> {
    if (!this.token) return null;

    try {
      return await this.request('/auth/user');
    } catch {
      this.token = null;
      localStorage.removeItem('access_token');
      return null;
    }
  }

  // Data methods
  async getData<T>(table: string): Promise<DataResponse<T[]>> {
    return this.request(`/data/${table}`);
  }

  async createData<T>(table: string, payload: any): Promise<DataResponse<T>> {
    return this.request(`/data/${table}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateData<T>(
    table: string,
    id: string,
    payload: any
  ): Promise<DataResponse<T>> {
    return this.request(`/data/${table}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteData(table: string, id: string): Promise<void> {
    await this.request(`/data/${table}/${id}`, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient();
