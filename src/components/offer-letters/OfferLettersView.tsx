import React, { useState } from 'react';
import { Plus, Mail, FileText, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useOfferLetters, useOfferLetterTemplates, useDeleteOfferLetterTemplate } from '../../hooks/useOfferLetters';
import OfferLettersTable from './OfferLettersTable';
import OfferLetterCreateModal from './OfferLetterCreateModal';
import OfferLetterTemplateModal from './OfferLetterTemplateModal';
import { motion } from 'motion/react';
import { useAlert } from '../../contexts/AlertContext';
import { ConfirmDialog } from '@/components/ui/blih';
import { useLocation, useNavigate } from 'react-router-dom';

export default function OfferLettersView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'letters' | 'templates'>('letters');
  const [createLetterOpen, setCreateLetterOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { showAlert } = useAlert();

  const { data: offerLetters = [], refetch: refetchLetters } = useOfferLetters();
  const { data: templates = [], isLoading: loadingTemplates, refetch: refetchTemplates } = useOfferLetterTemplates();
  const deleteTemplate = useDeleteOfferLetterTemplate();

  const handleDeleteTemplate = async (t: any) => {
    try {
      await deleteTemplate.mutateAsync(t.id);
      setDeleteTarget(null);
      showAlert('Template deleted', 'success');
    } catch {
      showAlert('Failed to delete template', 'error');
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" /> Offer Letters
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage and send official employment offers.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const prefix = location.pathname.startsWith('/business-admin') ? '/business-admin' : '/hr-manager';
              navigate(`${prefix}/offer-letters/templates/new`);
            }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Create Template
          </button>
          <button
            onClick={() => setCreateLetterOpen(true)}
            className="px-5 py-2 bg-blue-600 rounded-xl text-sm font-extrabold text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-blue-200 stroke-[3]" /> Generate Offer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('letters')}
          className={`px-5 py-1.5 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'letters' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          All Letters
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-5 py-1.5 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Templates
        </button>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'letters' && (
          <OfferLettersTable
            offerLetters={offerLetters}
            showAlert={showAlert}
            onRefresh={refetchLetters}
          />
        )}

        {activeTab === 'templates' && (
          <>
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-bold">Loading templates…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {templates.map((t: any) => (
                  <div
                    key={t.id}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden flex flex-col"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-[15px]">{t.name}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2">{t.subject}</p>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTemplate(t);
                          setCreateTemplateOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-black rounded-lg transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(t);
                        }}
                        disabled={deleteTemplate.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-black rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="col-span-full p-12 text-center text-slate-500 text-sm font-medium bg-white rounded-2xl border border-slate-100">
                    No templates found. Create one.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>

      <OfferLetterCreateModal
        isOpen={createLetterOpen}
        onClose={() => setCreateLetterOpen(false)}
        showAlert={showAlert}
        onSuccess={() => { refetchLetters(); }}
      />
      <OfferLetterTemplateModal
        isOpen={createTemplateOpen}
        onClose={() => {
          setCreateTemplateOpen(false);
          setEditingTemplate(null);
        }}
        showAlert={showAlert}
        onSuccess={() => {
          refetchTemplates();
          setEditingTemplate(null);
        }}
        initialData={editingTemplate}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteTemplate(deleteTarget)}
        title="Delete Offer Template"
        description={deleteTarget ? `Delete template "${deleteTarget.name}"?` : undefined}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteTemplate.isPending}
      />
    </div>
  );
}
