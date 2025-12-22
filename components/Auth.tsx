import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Zap, Loader2, Mail, Lock, ArrowRight, Settings, AlertCircle, Save } from 'lucide-react';
import { Button } from './Button';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  
  // Config State
  const [showConfig, setShowConfig] = useState(false);
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');

  useEffect(() => {
    // Carregar configurações salvas ao abrir a tela de config
    const savedUrl = localStorage.getItem('sb_url');
    const savedKey = localStorage.getItem('sb_key');
    if (savedUrl) setConfigUrl(savedUrl);
    if (savedKey) setConfigKey(savedKey);

    // Se não houver config salva e as envs não existirem (detectado pelo placeholder no client), sugerir config
    if (!savedUrl && supabase.supabaseUrl.includes('placeholder')) {
        // Opcional: abrir config automaticamente ou mostrar aviso
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Cadastro realizado! Se o login não for automático, tente entrar.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error(error);
      let errorMsg = error.message || 'Ocorreu um erro.';
      
      // Tratamento amigável para erro de conexão/fetch
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
          errorMsg = 'Falha na conexão. Verifique suas credenciais do Supabase na configuração (ícone de engrenagem).';
          setShowConfig(true); // Abre a config automaticamente para ajudar
      } else if (errorMsg.includes('Invalid login credentials')) {
          errorMsg = 'Email ou senha incorretos.';
      }

      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
      e.preventDefault();
      if (!configUrl || !configKey) {
          setMessage({ type: 'error', text: 'Preencha a URL e a Chave.' });
          return;
      }
      
      localStorage.setItem('sb_url', configUrl);
      localStorage.setItem('sb_key', configKey);
      
      setMessage({ type: 'success', text: 'Configuração salva! Recarregando...' });
      
      // Pequeno delay para feedback visual antes de recarregar
      setTimeout(() => {
          window.location.reload();
      }, 1000);
  };

  if (showConfig) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
            <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100 relative">
                <button onClick={() => setShowConfig(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <ArrowRight size={20} className="rotate-180" /> Voltar
                </button>
                
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 mb-3">
                        <Settings size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Configurar Conexão</h2>
                    <p className="text-slate-500 text-sm text-center mt-1">Insira as chaves do seu projeto Supabase.</p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg flex gap-3 mb-6">
                    <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                    <p className="text-xs text-blue-700 leading-relaxed">
                        Você encontra esses dados no painel do Supabase em: <br/>
                        <strong>Project Settings &gt; API</strong>.
                    </p>
                </div>

                <form onSubmit={handleSaveConfig} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Project URL</label>
                        <input
                            type="text"
                            value={configUrl}
                            onChange={(e) => setConfigUrl(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="https://seu-projeto.supabase.co"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Project API Key (Anon/Public)</label>
                        <input
                            type="text"
                            value={configKey}
                            onChange={(e) => setConfigKey(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                        />
                    </div>
                     <Button type="submit" className="w-full h-11 text-sm gap-2">
                        <Save size={16} /> Salvar e Recarregar
                    </Button>
                </form>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative">
      <div className="absolute top-4 right-4">
          <button 
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm transition-all"
          >
              <Settings size={14} /> Configurar API
          </button>
      </div>

      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 text-white mb-4">
            <Zap size={24} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">FlowState</h1>
          <p className="text-slate-500 text-sm">Sistema de Produtividade Pessoal</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              {message.text}
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-base shadow-brand-500/25" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
            {!loading && <ArrowRight size={18} className="ml-2" />}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
            className="text-sm text-slate-500 hover:text-brand-600 font-medium transition-colors"
          >
            {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
};