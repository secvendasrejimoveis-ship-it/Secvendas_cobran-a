
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, Lock, Mail, Loader2, AlertCircle, Github } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{message: string, details?: string} | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError({ 
          message: error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message,
          details: error.status?.toString()
        });
        setLoading(false);
      }
    } catch (err: any) {
      setError({ 
        message: 'Erro de conexão com o servidor.',
        details: err.message 
      });
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    // Caso você queira configurar o GitHub como provedor no painel do Supabase
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) setError({ message: "Erro ao conectar com GitHub", details: error.message });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-200 mb-6">
            <CreditCard className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Comissio</h1>
          <p className="text-gray-500 font-medium">Gestão Interna de Comissões</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center space-x-3 text-sm font-bold mb-1">
                  <AlertCircle size={18} />
                  <span>{error.message}</span>
                </div>
                {error.details && <p className="text-[10px] opacity-70 ml-7 break-all">ID do Erro: {error.details}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all outline-none font-semibold text-gray-800 placeholder-gray-400"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all outline-none font-semibold text-gray-800 placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <span>Entrar no Sistema</span>}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-bold tracking-widest">Ou acesse com</span></div>
          </div>

          <button 
            onClick={handleGitHubLogin}
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <Github size={20} />
            <span>GitHub Account</span>
          </button>
        </div>
        
        <p className="text-center mt-8 text-gray-400 text-xs font-bold uppercase tracking-widest">
          Acesso Restrito a Colaboradores
        </p>
      </div>
    </div>
  );
};

export default Login;
