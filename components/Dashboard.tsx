
import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Debt, Debtor, Project, DebtStatus, InstallmentStatus } from '../types';

interface DashboardProps {
  debts: Debt[];
  debtors: Debtor[];
  projects: Project[];
  onNavigateToDebts: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ debts, debtors, projects, onNavigateToDebts }) => {
  const totalReceivable = debts.reduce((acc, d) => acc + d.commission_value, 0);
  
  const totalReceived = debts.reduce((acc, d) => {
    return acc + (d.installments || [])
      .filter(i => i.status === InstallmentStatus.PAID)
      .reduce((iAcc, i) => iAcc + i.amount, 0);
  }, 0);

  const pendingAmount = totalReceivable - totalReceived;

  // Próximos 5 vencimentos pendentes
  const upcoming = debts.flatMap(d => (d.installments || []).map(i => ({
    ...i,
    debtorName: debtors.find(db => db.id === d.debtor_id)?.name,
    projectName: projects.find(p => p.id === d.project_id)?.name
  })))
  .filter(i => i.status === InstallmentStatus.PENDING)
  .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  .slice(0, 5);

  const stats = [
    { label: 'Total em Aberto', value: pendingAmount, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Recebido', value: totalReceived, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Ticket Médio', value: debts.length ? totalReceivable / debts.length : 0, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Devedores', value: debtors.length, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthlyData = monthNames.map((name, index) => {
    const amount = debts.reduce((acc, debt) => {
      return acc + (debt.installments || []).reduce((iAcc, inst) => {
        const dueDate = new Date(inst.due_date);
        if (dueDate.getMonth() === index && dueDate.getFullYear() === new Date().getFullYear()) {
          return iAcc + inst.amount;
        }
        return iAcc;
      }, 0);
    }, 0);
    return { name, amount };
  });

  const statusDistribution = [
    { name: 'Abertas', value: debts.filter(d => d.status === DebtStatus.OPEN).length, color: '#3b82f6' },
    { name: 'Parciais', value: debts.filter(d => d.status === DebtStatus.PARTIAL).length, color: '#f59e0b' },
    { name: 'Quitadas', value: debts.filter(d => d.status === DebtStatus.PAID).length, color: '#10b981' },
  ].filter(s => s.value > 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
          <p className="text-gray-500">Monitoramento financeiro em tempo real.</p>
        </div>
        <button onClick={onNavigateToDebts} className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
          <span>Ver Todas Cobranças</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl w-fit mb-4`}><stat.icon size={24} /></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-800">
              {stat.label.includes('Total') || stat.label.includes('Ticket') ? formatCurrency(stat.value) : stat.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center space-x-2">
              <TrendingUp size={18} className="text-blue-600" />
              <span>Previsão de Recebíveis {new Date().getFullYear()}</span>
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    formatter={(val: number) => [formatCurrency(val), 'Valor']} 
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <CalendarDays size={18} className="text-orange-600" />
              <span>Próximos Vencimentos</span>
            </h3>
            <div className="space-y-3">
              {upcoming.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex flex-col items-center justify-center text-orange-600">
                      <span className="text-[10px] font-black uppercase leading-none">{new Date(u.due_date).toLocaleString('pt-BR', {month: 'short'})}</span>
                      <span className="text-sm font-black">{new Date(u.due_date).getDate()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{u.debtorName}</p>
                      <p className="text-xs text-gray-500">{u.projectName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">{formatCurrency(u.amount)}</p>
                    <p className="text-[10px] font-bold text-gray-400">Parcela #{u.number}</p>
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p className="text-center py-6 text-sm text-gray-400">Nenhum vencimento pendente.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6">Saúde das Cobranças</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusDistribution} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                    {statusDistribution.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3 w-full">
              {statusDistribution.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: s.color}} />
                    <span className="text-gray-600 font-medium">{s.name}</span>
                  </div>
                  <span className="font-bold text-gray-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
