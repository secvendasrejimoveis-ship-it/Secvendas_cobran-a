
import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Building2, Loader2 } from 'lucide-react';
import { Project } from '../types';
import { supabase } from '../lib/supabase';

interface ProjectListProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, setProjects }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tower: '',
    unit: '',
    vgv: 0
  });

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.unit.includes(searchTerm)
  );

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingProject) {
        const { data, error } = await supabase
          .from('projects')
          .update(formData)
          .eq('id', editingProject.id)
          .select();
        
        if (error) throw error;
        setProjects(prev => prev.map(p => p.id === editingProject.id ? data[0] : p));
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert([formData])
          .select();
        
        if (error) throw error;
        setProjects(prev => [data[0], ...prev]);
      }
      closeModal();
    } catch (err) {
      alert('Erro ao salvar empreendimento.');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        tower: project.tower,
        unit: project.unit,
        vgv: project.vgv
      });
    } else {
      setEditingProject(null);
      setFormData({ name: '', tower: '', unit: '', vgv: 0 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const deleteProject = async (id: string) => {
    if (confirm('Deseja realmente excluir este empreendimento?')) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
        setProjects(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        alert('Erro ao excluir. O empreendimento pode estar vinculado a cobranças.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Empreendimentos</h1>
          <p className="text-gray-500">Cadastre torres e unidades integrados ao Supabase.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Novo Empreendimento</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <div className="max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou unidade..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Empreendimento</th>
                <th className="px-6 py-4">Unidade / Torre</th>
                <th className="px-6 py-4">VGV</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{project.name}</p>
                        <p className="text-xs text-gray-500">Cadastrado em {new Date(project.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">Torre: {project.tower}</p>
                    <p className="text-sm text-gray-700 font-medium">Unidade: {project.unit}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{formatCurrency(project.vgv)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => openModal(project)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteProject(project.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                {editingProject ? 'Editar Empreendimento' : 'Novo Empreendimento'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Empreendimento</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Torre</label>
                  <input 
                    type="text" required
                    value={formData.tower}
                    onChange={e => setFormData({...formData, tower: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <input 
                    type="text" required
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VGV (Valor Global de Venda)</label>
                <input 
                  type="number" step="0.01" required
                  value={formData.vgv}
                  onChange={e => setFormData({...formData, vgv: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pt-4 flex items-center space-x-3">
                <button 
                  type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center space-x-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingProject ? 'Atualizar' : 'Salvar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
