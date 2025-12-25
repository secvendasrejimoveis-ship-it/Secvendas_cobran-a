
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  Clock, 
  Building2,
  User,
  DollarSign,
  Loader2,
  Printer
} from 'lucide-react';
import { Debt, Debtor, Project, DebtStatus, InstallmentStatus } from '../types';
import { supabase } from '../lib/supabase';

interface DebtDetailProps {
  debt: Debt;
  debtor: Debtor;
  project: Project;
  onUpdateDebt: (debt: Debt) => void;
  onBack: () => void;
}

const DebtDetail: React.FC<DebtDetailProps> = ({ debt, debtor, project, onUpdateDebt, onBack }) => {
  const [updating, setUpdating] = useState<string | null>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const togglePayment = async (installmentId: string) => {
    setUpdating(installmentId);
    const inst = debt.installments?.find(i => i.id === installmentId);
    if (!inst) return;

    const isNowPaid = inst.status !== InstallmentStatus.PAID;
    const newInstStatus = isNowPaid ? InstallmentStatus.PAID : InstallmentStatus.PENDING;
    const paidAt = isNowPaid ? new Date().toISOString() : null;

    try {
      const { data: updatedInst, error: instError } = await supabase
        .from('installments')
        .update({ status: newInstStatus, paid_at: paidAt })
        .eq('id', installmentId)
        .select();

      if (instError) throw instError;

      const newInstallments = (debt.installments || []).map(i => i.id === installmentId ? updatedInst[0] : i);
      const paidCount = newInstallments.filter(i => i.status === InstallmentStatus.PAID).length;
      
      let newDebtStatus = DebtStatus.OPEN;
      if (paidCount === debt.installment_count) newDebtStatus = DebtStatus.PAID;
      else if (paidCount > 0) newDebtStatus = DebtStatus.PARTIAL;

      if (newDebtStatus !== debt.status) {
        await supabase.from('debts').update({ status: newDebtStatus }).eq('id', debt.id);
      }

      onUpdateDebt({
        ...debt,
        installments: newInstallments,
        status: newDebtStatus
      });
    } catch (err) {
      alert('Erro ao atualizar pagamento.');
    } finally {
      setUpdating(null);
    }
  };

  const totalPaid = (debt.installments || [])
    .filter(i => i.status === InstallmentStatus.PAID)
    .reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={onBack} className="flex items-center space-x-2 text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={20} />
          <span>Voltar para lista</span>
        </button>
        <button 
          onClick={() => window.print()} 
          className="flex items-center space-x-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all shadow-md"
        >
          <Printer size={18} />
          <span>Gerar Relatório (PDF)</span>
        </button>
      </div>

      {/* Header do Relatório (Apenas Visível na Impressão) */}
      <div className="hidden print:block border-b-2 border-gray-900 pb-6 mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Extrato de Cobrança</h1>
            <p className="text-gray-500">Comissio - Gestão Financeira Imobiliária</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Emitido em: {new Date().toLocaleDateString()}</p>
            <p>Ref: #{debt.id.substring(0,8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center space-x-2">
              <DollarSign size={20} className="text-blue-600" />
              <span>Resumo Financeiro</span>
            </h3>
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-50">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Devedor</p>
                <p className="font-bold text-gray-900">{debtor?.name}</p>
                <p className="text-xs text-gray-500">{debtor?.tax_id}</p>
              </div>
              <div className="pb-4 border-b border-gray-50">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Projeto</p>
                <p className="font-bold text-gray-900">{project?.name}</p>
                <p className="text-xs text-gray-500">Unidade {project?.unit} • Torre {project?.tower}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Total Comissão</p>
                  <p className="font-bold">{formatCurrency(debt.commission_value)}</p>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <p className="text-sm">Total Recebido</p>
                  <p className="font-bold">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t font-black text-gray-900">
                  <p>Saldo Devedor</p>
                  <p>{formatCurrency(debt.commission_value - totalPaid)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Cronograma de Pagamentos</h3>
              <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider ${
                debt.status === DebtStatus.PAID ? 'bg-green-100 text-green-700' : 
                debt.status === DebtStatus.PARTIAL ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
              }`}>{debt.status}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Parcela</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Vencimento</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right print:hidden">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-t">
                  {debt.installments?.sort((a,b) => a.number - b.number).map((inst) => (
                    <tr key={inst.id} className={`${inst.status === InstallmentStatus.PAID ? 'bg-green-50/30' : ''} transition-colors`}>
                      <td className="px-6 py-4 text-sm font-bold">#{String(inst.number).padStart(2, '0')}</td>
                      <td className="px-6 py-4 font-black text-gray-900">{formatCurrency(inst.amount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(inst.due_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          inst.status === InstallmentStatus.PAID ? 'text-green-600 bg-green-100' : 'text-gray-400 bg-gray-100'
                        }`}>
                          {inst.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right print:hidden">
                        <button 
                          disabled={!!updating}
                          onClick={() => togglePayment(inst.id)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                            inst.status === InstallmentStatus.PAID 
                              ? 'text-red-500 hover:bg-red-50 border border-red-100' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {updating === inst.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : 
                            (inst.status === InstallmentStatus.PAID ? 'Estornar' : 'Confirmar')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-400 text-center italic hidden print:block">
            Este documento é um extrato informativo. Para validade jurídica, consulte o contrato original.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtDetail;
