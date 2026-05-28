import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Save } from 'lucide-react';
import { api } from '../../api/client';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (title: string, type?: 'success' | 'error' | 'info') => void;
  onSuccess?: (data?: any) => void;
}

export function CreateDepartmentModal({ isOpen, onClose, showAlert, onSuccess }: ModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name) return showAlert('Name is required', 'error');
    setLoading(true);
    try {
       const res = await api.post('/api/v1/departments', { name });
       showAlert('Department created successfully', 'success');
       onSuccess?.(res.data?.data?.department || res.data?.department);
      onClose();
    } catch (e: any) {
      showAlert(e.response?.data?.message || 'Failed to create department', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800">Create New Department</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Department Name</label>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Engineering, Marketing..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all" 
            />
          </div>
          <button 
            disabled={loading}
            onClick={handleSave}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Creating...' : <><Save className="w-4 h-4" /> Create Department</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function CreatePositionModal({ isOpen, onClose, showAlert, onSuccess, initialDeptId }: ModalProps & { initialDeptId?: string }) {
  const [title, setTitle] = useState('');
  const [deptId, setDeptId] = useState(initialDeptId || '');
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/api/v1/departments').then(res => setDepartments(res.data.data?.departments || res.data.rows || res.data.data || [])).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title || !deptId) return showAlert('Title and Department are required', 'error');
    setLoading(true);
    try {
       const res = await api.post('/api/v1/positions', { title, departmentId: deptId });
       showAlert('Position created successfully', 'success');
       onSuccess?.(res.data?.data?.position || res.data?.position);
      onClose();
    } catch (e: any) {
      showAlert(e.response?.data?.message || 'Failed to create position', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800">Create New Job Position</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Department</label>
            <select 
              value={deptId} 
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Position Title</label>
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Senior Backend Engineer" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all" 
            />
          </div>
          <button 
            disabled={loading}
            onClick={handleSave}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Creating...' : <><Save className="w-4 h-4" /> Create Position</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
