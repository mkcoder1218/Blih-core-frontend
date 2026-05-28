import React, { useState, useEffect } from 'react';
import { Plus, Mail } from 'lucide-react';
import { getOfferLetters, getOfferLetterTemplates } from '../../api/offerLetters';
import OfferLettersTable from './OfferLettersTable';
import OfferLetterCreateModal from './OfferLetterCreateModal';
import OfferLetterTemplateModal from './OfferLetterTemplateModal';
import { motion } from 'motion/react';

export default function OfferLettersView() {
  const [activeTab, setActiveTab] = useState<'letters' | 'templates'>('letters');
  
  const [offerLetters, setOfferLetters] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [createLetterOpen, setCreateLetterOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  
  const [alert, setAlert] = useState<{title: string, type: string}|null>(null);

  useEffect(() => {
    if (activeTab === 'letters') fetchLetters();
    else fetchTemplates();
  }, [activeTab]);

  const fetchLetters = async () => {
    try {
      const res = await getOfferLetters({});
      setOfferLetters(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await getOfferLetterTemplates();
      setTemplates(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const showAlert = (title: string, type: 'success'|'error'|'info' = 'success') => {
    setAlert({ title, type });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
       {alert && (
          <div className={`fixed top-4 right-4 z-[999] px-6 py-3 rounded-lg shadow-lg text-sm font-bold text-white transition-all
            ${alert.type === 'success' ? 'bg-emerald-600' : alert.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'}`}>
             {alert.title}
          </div>
       )}
       
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
             onClick={() => setCreateTemplateOpen(true)}
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
         <button onClick={() => setActiveTab('letters')} className={`px-5 py-1.5 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'letters' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All Letters</button>
         <button onClick={() => setActiveTab('templates')} className={`px-5 py-1.5 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Templates</button>
       </div>

       {/* Content */}
       <motion.div
         key={activeTab}
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.2 }}
       >
         {activeTab === 'letters' && (
           <OfferLettersTable offerLetters={offerLetters} showAlert={showAlert} onRefresh={fetchLetters} />
         )}

         {activeTab === 'templates' && (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
             {templates.map(t => (
               <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-[15px]">{t.name}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2">{t.subject}</p>
               </div>
             ))}
             {templates.length === 0 && (
                <div className="col-span-full p-12 text-center text-slate-500 text-sm font-medium bg-white rounded-2xl border border-slate-100">
                  No templates found. Create one.
                </div>
             )}
           </div>
         )}
       </motion.div>

       <OfferLetterCreateModal
         isOpen={createLetterOpen}
         onClose={() => setCreateLetterOpen(false)}
         showAlert={showAlert}
         onSuccess={fetchLetters}
       />
       <OfferLetterTemplateModal
         isOpen={createTemplateOpen}
         onClose={() => setCreateTemplateOpen(false)}
         showAlert={showAlert}
         onSuccess={fetchTemplates}
       />
    </div>
  );
}
