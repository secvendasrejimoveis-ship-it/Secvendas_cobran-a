
import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, User, Loader2 } from 'lucide-react';
import { Debtor } from '../types';
import { supabase } from '../lib/supabase';

interface DebtorListProps {
  debtors: Debtor[];
  setDebtors: React.Dispatch<React.SetStateAction<Debtor[]>>;
}

const DebtorList: React.FC<DebtorListProps> = ({ debtors, setDebtors }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState<Debtor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    email: '',
    phone: ''
  });

  const filteredDebtors = debtors.filter(d => 
    (d.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (d.tax_id || '').includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingDebtor) {
        const { data, error } = await supabase
          .from('debtors')
          .update({
            name: formData.name,
            tax_id: formData.taxId,
            email: formData.email,
            phone: formData.phone
          })
          .eq('id', editingDebtor.id)
          .select();
        
        if (error) throw error;
        setDebtors(prev => prev.map(d => d.id === editingDebtor.id ? data[0] : d));
      } else {
        const { data, error } = await supabase
          .from('debtors')
          .insert([{
            name: formData.name,
            tax_id: formData.taxId,
            email: formData.email,
            phone: formData.phone
          }])
          .select();
        
        if (error) throw error;
        setDebtors(prev => [data[0], ...prev]);
      }
      closeModal();
    } catch (err) {
      alert('Erro ao salvar no Supabase. Verifique se as tabelas foram criadas no painel SQL do Supabase.');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (debtor?: Debtor) => {
    if (debtor) {
      setEditingDebtor(debtor);
      setFormData({
        name: debtor.name,
        taxId: debtor.tax_id,
        email: debtor.email,
        phone: debtor.phone
      });
    } else {
      setEditingDebtor(null);
      setFormData({ name: '', taxId: '', email: '', phone: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDebtor(null);
  };

  const deleteDebtor = async (id: string) => {
    if (confirm('Deseja realmente excluir este devedor?')) {
      try {
        const { error } = await supabase.from('debtors').delete().eq('id', id);
        if (error) throw error;
        setDebtors(prev => prev.filter(d => d.id !== id));
      } catch (err) {
        alert('Erro ao excluir. O devedor pode estar vinculado a cobranças.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Devedores</h1>
          <p className="text-gray-500">Banco de dados centralizado no Supabase.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Novo Devedor</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <div className="max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou CPF/CNPJ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Nome / Cadastro</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDebtors.map((debtor) => (
                <tr key={debtor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{debtor.name}</p>
                        <p className="text-xs text-gray-500">{debtor.tax_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{debtor.email}</p>
                    <p className="text-xs text-gray-500">{debtor.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => openModal(debtor)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteDebtor(debtor.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDebtors.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                    Nenhum devedor encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                {editingDebtor ? 'Editar Devedor' : 'Novo Devedor'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo / Razão Social</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ</label>
                <input 
                  type="text" required
                  value={formData.taxId}
                  onChange={e => setFormData({...formData, taxId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input 
                    type="email" required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input 
                    type="text" required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex items-center space-x-3">
                <button 
                  type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingDebtor ? 'Atualizar' : 'Salvar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtorList;
