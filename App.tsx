
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  FileText, 
  LayoutDashboard, 
  AlertCircle,
  Menu,
  X,
  CreditCard,
  Loader2,
  Database,
  RefreshCw,
  WifiOff,
  LogOut
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import DebtorList from './components/DebtorList';
import ProjectList from './components/ProjectList';
import DebtList from './components/DebtList';
import DebtDetail from './components/DebtDetail';
import Login from './components/Login';
import { Debtor, Project, Debt } from './types';
import { supabase } from './lib/supabase';

type View = 'dashboard' | 'debtors' | 'projects' | 'debts' | 'debt-detail';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{message: string, isNetwork: boolean} | null>(null);

  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
      else setLoading(false);
    });

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
      else {
        setDebtors([]);
        setProjects([]);
        setDebts([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [debtorsRes, projectsRes, debtsRes] = await Promise.all([
        supabase.from('debtors').select('*').order('name'),
        supabase.from('projects').select('*').order('name'),
        supabase.from('debts').select('*, installments(*)').order('created_at', { ascending: false })
      ]);

      if (debtorsRes.error) throw debtorsRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (debtsRes.error) throw debtsRes.error;

      setDebtors(debtorsRes.data || []);
      setProjects(projectsRes.data || []);
      setDebts(debtsRes.data || []);
    } catch (err: any) {
      console.error('Erro Supabase:', err);
      const isNetwork = err.message === 'Failed to fetch' || err.name === 'TypeError';
      setError({
        message: isNetwork 
          ? "Erro de Rede: Verifique sua conexão ou se as tabelas existem no Supabase."
          : err.message || "Erro desconhecido.",
        isNetwork
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session && !loading) {
    return <Login />;
  }

  const SidebarItem = ({ icon: Icon, label, view, active }: { icon: any, label: string, view: View, active: boolean }) => (
    <button
      onClick={() => {
        setActiveView(view);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      <Icon size={20} />
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {isSidebarOpen && window.innerWidth < 768 && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-blue-200 shadow-lg">
                <CreditCard className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tighter">Comissio</span>
            </div>
            <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
          </div>
          <nav className="flex-1 px-6 space-y-2 mt-4">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" view="dashboard" active={activeView === 'dashboard'} />
            <div className="py-4"><div className="h-px bg-gray-100" /></div>
            <SidebarItem icon={Users} label="Devedores" view="debtors" active={activeView === 'debtors'} />
            <SidebarItem icon={Building2} label="Empreendimentos" view="projects" active={activeView === 'projects'} />
            <SidebarItem icon={FileText} label="Cobranças" view="debts" active={activeView === 'debts' || activeView === 'debt-detail'} />
          </nav>
          
          <div className="p-4 mt-auto">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
            >
              <LogOut size={20} />
              <span>Sair do Sistema</span>
            </button>
            <div className="p-4 bg-gray-50/50 mt-4 rounded-2xl border border-gray-100">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`} />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{session?.user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 shrink-0 z-10">
          <button className="md:hidden text-gray-600 p-2 hover:bg-gray-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
          <div className="flex-1 px-4">
            {loading && (
              <div className="flex items-center space-x-2 text-blue-600 text-sm font-bold bg-blue-50 w-fit px-4 py-1.5 rounded-full border border-blue-100 animate-pulse">
                <RefreshCw size={14} className="animate-spin" />
                <span>Atualizando...</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={fetchData} className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"><Database size={20} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {error ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
              <div className="bg-red-50 text-red-600 p-6 rounded-3xl mb-6 border border-red-100">
                <AlertCircle size={48} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Erro no Banco de Dados</h2>
              <p className="text-gray-500 mb-8 text-sm">{error.message}</p>
              <button onClick={fetchData} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30">Tentar Novamente</button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {activeView === 'dashboard' && <Dashboard debts={debts} debtors={debtors} projects={projects} onNavigateToDebts={() => setActiveView('debts')} />}
              {activeView === 'debtors' && <DebtorList debtors={debtors} setDebtors={setDebtors} />}
              {activeView === 'projects' && <ProjectList projects={projects} setProjects={setProjects} />}
              {activeView === 'debts' && <DebtList debts={debts} debtors={debtors} projects={projects} setDebts={setDebts} onViewDetail={(id) => { setSelectedDebtId(id); setActiveView('debt-detail'); }} />}
              {activeView === 'debt-detail' && selectedDebtId && (
                <DebtDetail 
                  debt={debts.find(d => d.id === selectedDebtId)!}
                  debtor={debtors.find(db => db.id === debts.find(d => d.id === selectedDebtId)?.debtor_id)!}
                  project={projects.find(p => p.id === debts.find(d => d.id === selectedDebtId)?.project_id)!}
                  onUpdateDebt={(updatedDebt) => setDebts(prev => prev.map(d => d.id === updatedDebt.id ? updatedDebt : d))}
                  onBack={() => setActiveView('debts')}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
