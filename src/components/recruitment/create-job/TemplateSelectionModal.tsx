import React, { useEffect, useState } from 'react';
import { X, FileText, Search, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../../../api/client';

interface Template {
  id: string;
  name: string;
  description: string;
  requestConfig: any;
  jobDetailsConfig: any;
  applicationFormConfig: any;
  createdAt: string;
}

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
  onSkip: () => void;
}

export default function TemplateSelectionModal({ isOpen, onClose, onSelect, onSkip }: TemplateSelectionModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(null);
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/hr/recruitment/templates');
      const payload: any = res.data;
      const rows = payload?.data?.data ?? payload?.data ?? [];
      if (Array.isArray(rows)) setTemplates(rows);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Choose Template</h2>
            <p className="text-[11px] text-slate-400 font-medium">Select a saved template to pre-fill your hiring request</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">Fetching Templates...</span>
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedId(template.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                    selectedId === template.id
                      ? 'border-blue-300 bg-blue-50/30'
                      : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-900 tracking-tight">{template.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{template.description}</p>
                    <span className="text-[9px] text-slate-300 font-bold uppercase mt-1 block">Modified {template.createdAt}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-xs font-bold">No templates found matching your search.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button 
            onClick={onSkip}
            className="text-xs font-black text-blue-600 hover:text-blue-700 underline"
          >
            Start with blank form
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm"
            >
              Close
            </button>
            <button
              disabled={!selectedId}
              onClick={() => {
                const tpl = templates.find((t) => t.id === selectedId);
                if (tpl) onSelect(tpl);
              }}
              className="px-6 py-2.5 bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-200"
            >
              Use template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
