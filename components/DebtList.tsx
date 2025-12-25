
import React, { useState } from 'react';
import { Plus, Search, Filter, Eye, Trash2, X, Loader2, FileSpreadsheet, FileWarning } from 'lucide-react';
import { Debt, Debtor, Project, DebtStatus, InstallmentStatus } from '../types';
import { supabase } from '../lib/supabase';

interface DebtListProps {
  debts: Debt[];
  debtors: Debtor[];
  projects: Project[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  onViewDetail: (id: string) => void;
}

const DebtList: React.FC<DebtListProps> = ({ debts, debtors, projects, setDebts, onViewDetail }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    debtor_id: '',
    project_id: '',
    commission_rate: 5,
    installment_count: 1,
    start_date: new Date().toISOString().split('T')[0]
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const exportToCSV = () => {
    const headers = ["Devedor", "Empreendimento", "Unidade", "VGV", "Comissao (%)", "Valor Comissao", "Parcelas", "Status", "Data Inicio"];
    const rows = filteredDebts.map(d => {
      const debtor = debtors.find(db => db.id === d.debtor_id);
      const project = projects.find(p => p.id === d.project_id);
      return [
        `"${debtor?.name || '---'}"`,
        `"${project?.name || '---'}"`,
        `"${project?.unit || '---'}"`,
        d.total_value,
        d.commission_rate,
        d.commission_value,
        d.installment_count,
        d.status,
        d.start_date
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `cobrancas_comissio_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.debtor_id || !formData.project_id) {
      alert("Selecione um devedor e um empreendimento.");
      return;
    }
    setSubmitting(true);
    const project = projects.find(p => p.id === formData.project_id);
    if (!project) return;

    const commissionValue = project.vgv * (formData.commission_rate / 100);

    try {
      const { data: debtData, error: debtError } = await supabase
        .from('debts')
        .insert([{
          debtor_id: formData.debtor_id,
          project_id: formData.project_id,
          total_value: project.vgv,
          commission_rate: formData.commission_rate,
          commission_value: commissionValue,
          installment_count: formData.installment_count,
          start_date: formData.start_date,
          status: DebtStatus.OPEN
        }])
        .select();

      if (debtError) throw debtError;
      const newDebtId = debtData[0].id;

      const installmentsPayload = [];
      const date = new Date(formData.start_date);
      for (let i = 1; i <= formData.installment_count; i++) {
        const dueDate = new Date(date);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        installmentsPayload.push({
          debt_id: newDebtId,
          number: i,
          amount: commissionValue / formData.installment_count,
          due_date: dueDate.toISOString().split('T')[0],
          status: InstallmentStatus.PENDING
        });
      }

      const { data: instData, error: instError } = await supabase.from('installments').insert(installmentsPayload).select();
      if (instError) throw instError;

      const completeDebt: Debt = { ...debtData[0], installments: instData };
      setDebts(prev => [completeDebt, ...prev]);
      setIsModalOpen(false);
    } catch (err) {
      alert('Erro ao processar cobrança.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDebt = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja realmente excluir esta cobrança?')) {
      try {
        const { error } = await supabase.from('debts').delete().eq('id', id);
        if (error) throw error;
        setDebts(prev => prev.filter(d => d.id !== id));
      } catch (err) {
        alert('Erro ao excluir.');
      }
    }
  };

  const filteredDebts = debts.filter(d => {
    const debtor = debtors.find(db => db.id === d.debtor_id);
    const project = projects.find(p => p.id === d.project_id);
    const matchesSearch = debtor?.name.toLowerCase().includes(searchTerm.toLowerCase()) || project?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cobranças</h1>
          <p className="text-gray-500">Gestão de parcelamento automático.</p>
        </div>
        <div className="flex items-center space-x-3">
          {debts.length > 0 && (
            <button 
              onClick={exportToCSV}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center space-x-2 transition-colors shadow-sm bg-white"
            >
              <FileSpreadsheet size={18} />
              <span className="hidden md:inline">Exportar CSV</span>
            </button>
          )}
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all shadow-md active:scale-95">
            <Plus size={18} />
            <span>Nova Cobrança</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Filtrar por devedor ou empreendimento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-50 border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">Todos os Status</option>
            <option value={DebtStatus.OPEN}>Abertas</option>
            <option value={DebtStatus.PARTIAL}>Parciais</option>
            <option value={DebtStatus.PAID}>Quitadas</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Devedor</th>
                <th className="px-6 py-4">Empreendimento</th>
                <th className="px-6 py-4">Comissão</th>
                <th className="px-6 py-4">Parcelas</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDebts.map((debt) => {
                const debtor = debtors.find(db => db.id === debt.debtor_id);
                const project = projects.find(p => p.id === debt.project_id);
                const paidCount = debt.installments?.filter(i => i.status === InstallmentStatus.PAID).length || 0;
                return (
                  <tr key={debt.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer group" onClick={() => onViewDetail(debt.id)}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{debtor?.name || '---'}</p>
                      <p className="text-[10px] text-gray-400">{debtor?.tax_id}</p>
                    </td>
                    <td className="px-6 py-4"><p className="text-sm font-medium text-gray-700">{project?.name}</p><p className="text-[10px] text-gray-400">Unid. {project?.unit}</p></td>
                    <td className="px-6 py-4"><p className="font-black text-gray-900">{formatCurrency(debt.commission_value)}</p><p className="text-[10px] text-gray-400">{debt.commission_rate}% de taxa</p></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-gray-700">{paidCount}/{debt.installment_count}</span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-blue-500" style={{width: `${(paidCount/debt.installment_count)*100}%`}} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${
                        debt.status === DebtStatus.PAID ? 'bg-green-100 text-green-700' : 
                        debt.status === DebtStatus.PARTIAL ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {debt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Eye size={16} /></button>
                        <button onClick={(e) => deleteDebt(debt.id, e)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDebts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center max-w-xs mx-auto">
                      <div className="bg-gray-50 p-4 rounded-full mb-4 text-gray-300">
                        <FileWarning size={48} />
                      </div>
                      <p className="text-gray-500 font-medium">Nenhuma cobrança encontrada.</p>
                      <p className="text-xs text-gray-400 mt-1">Crie sua primeira cobrança clicando no botão "Nova Cobrança" acima.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-800 tracking-tight">Gerar Nova Cobrança</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-full transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Selecione o Devedor</label>
                  <select 
                    required 
                    value={formData.debtor_id} 
                    onChange={e => setFormData({...formData, debtor_id: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-gray-50"
                  >
                    <option value="">Escolher...</option>
                    {debtors.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Empreendimento / Unid.</label>
                  <select 
                    required 
                    value={formData.project_id} 
                    onChange={e => setFormData({...formData, project_id: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-gray-50"
                  >
                    <option value="">Escolher...</option>
                    {projects.map(p => (<option key={p.id} value={p.id}>{p.name} - {p.unit}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div><label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Taxa (%)</label><input type="number" required step="0.1" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: parseFloat(e.target.value)})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50 font-bold" /></div>
                <div><label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Nº Parcelas</label><input type="number" required min="1" max="120" value={formData.installment_count} onChange={e => setFormData({...formData, installment_count: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50 font-bold" /></div>
                <div><label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Data Início</label><input type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50 font-bold text-sm" /></div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs text-blue-600 font-bold leading-relaxed">
                  O sistema gerará automaticamente {formData.installment_count} parcelas mensais baseado na data de início selecionada.
                </p>
              </div>

              <div className="pt-4 flex items-center space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-all">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2">
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : <span>Confirmar Lançamento</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtList;
