/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Layers, 
  Users, 
  Globe, 
  ShieldAlert, 
  CheckCircle, 
  HelpCircle, 
  Briefcase,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Check,
  Building
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  legalName: string;
  sector: string;
  email: string;
  domain: string;
  location: string;
  tier: 'Enterprise' | 'Corporate' | 'Developer';
  status: 'Active' | 'Suspended';
  established: string;
  employeeCount: number;
}

const INITIAL_BUSINESSES: Business[] = [
  {
    id: 'biz-1',
    name: 'Blih Marketing',
    legalName: 'Blih Marketing Group Ltd',
    sector: 'Marketing & PR',
    email: 'ops@blihmarketing.com',
    domain: 'blihmarketing.com',
    location: 'New York, USA',
    tier: 'Enterprise',
    status: 'Active',
    established: 'May 12, 2021',
    employeeCount: 148
  },
  {
    id: 'biz-2',
    name: 'Aether Logistics',
    legalName: 'Aether Shipping & Delivery Inc.',
    sector: 'Supply Chain',
    email: 'partner@aether-logistics.io',
    domain: 'aether-logistics.io',
    location: 'Rotterdam, NL',
    tier: 'Corporate',
    status: 'Active',
    established: 'Jan 28, 2022',
    employeeCount: 84
  },
  {
    id: 'biz-3',
    name: 'Zephyr FinTech',
    legalName: 'Zephyr decentralized payments LLC',
    sector: 'Banking & Financial',
    email: 'admin@zephyrpay.com',
    domain: 'zephyrpay.com',
    location: 'London, UK',
    tier: 'Enterprise',
    status: 'Active',
    established: 'Aug 04, 2023',
    employeeCount: 320
  },
  {
    id: 'biz-4',
    name: 'Chrono Health',
    legalName: 'Chronotech Healthcare Tech SA',
    sector: 'Medical & Health',
    email: 'contact@chronohealth.org',
    domain: 'chronohealth.org',
    location: 'Geneva, Switzerland',
    tier: 'Developer',
    status: 'Suspended',
    established: 'Nov 19, 2024',
    employeeCount: 12
  }
];

interface BusinessesViewProps {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function BusinessesView({ onDraftAiSuggestion, showAlert }: BusinessesViewProps) {
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    try {
      const saved = localStorage.getItem('blih_businesses');
      return saved ? JSON.parse(saved) : INITIAL_BUSINESSES;
    } catch {
      return INITIAL_BUSINESSES;
    }
  });

  const saveToLocal = (updated: Business[]) => {
    setBusinesses(updated);
    localStorage.setItem('blih_businesses', JSON.stringify(updated));
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formLegalName, setFormLegalName] = useState('');
  const [formSector, setFormSector] = useState('Technology');
  const [formEmail, setFormEmail] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formTier, setFormTier] = useState<'Enterprise' | 'Corporate' | 'Developer'>('Corporate');
  const [formStatus, setFormStatus] = useState<'Active' | 'Suspended'>('Active');
  const [formEmployeeCount, setFormEmployeeCount] = useState(1);

  const openCreateModal = () => {
    setEditingBusiness(null);
    setFormName('');
    setFormLegalName('');
    setFormSector('Technology');
    setFormEmail('');
    setFormDomain('');
    setFormLocation('');
    setFormTier('Corporate');
    setFormStatus('Active');
    setFormEmployeeCount(10);
    setIsModalOpen(true);
  };

  const openEditModal = (biz: Business) => {
    setEditingBusiness(biz);
    setFormName(biz.name);
    setFormLegalName(biz.legalName);
    setFormSector(biz.sector);
    setFormEmail(biz.email);
    setFormDomain(biz.domain);
    setFormLocation(biz.location);
    setFormTier(biz.tier);
    setFormStatus(biz.status);
    setFormEmployeeCount(biz.employeeCount);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you absolutely sure you want to delete and un-register business tenancy for "${name}"?\nThis is dangerous and terminates all current child active sessions.`)) {
      const filtered = businesses.filter(b => b.id !== id);
      saveToLocal(filtered);
      showAlert(`Terminated business tenant: ${name}`, 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formEmail || !formDomain) {
      showAlert('Please enter all mandatory fields.', 'error');
      return;
    }

    if (editingBusiness) {
      // Update
      const updated = businesses.map(b => b.id === editingBusiness.id ? {
        ...b,
        name: formName,
        legalName: formLegalName || `${formName} Inc`,
        sector: formSector,
        email: formEmail,
        domain: formDomain,
        location: formLocation || 'Unknown Headquarter',
        tier: formTier,
        status: formStatus,
        employeeCount: formEmployeeCount
      } : b);
      saveToLocal(updated);
      showAlert(`Successfully configured "${formName}" parameters!`, 'success');
    } else {
      // Create
      const newBiz: Business = {
        id: `biz-${Date.now()}`,
        name: formName,
        legalName: formLegalName || `${formName} Corp.`,
        sector: formSector,
        email: formEmail,
        domain: formDomain,
        location: formLocation || 'Remote Global Operations',
        tier: formTier,
        status: formStatus,
        established: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        employeeCount: formEmployeeCount || 1
      };
      saveToLocal([newBiz, ...businesses]);
      showAlert(`Registered new system-wide business tenant: ${formName}!`, 'success');
    }

    setIsModalOpen(false);
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSectorBadgeColor = (sector: string) => {
    const s = sector.toLowerCase();
    if (s.includes('tech') || s.includes('soft')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    if (s.includes('health') || s.includes('med')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (s.includes('finance') || s.includes('bank')) return 'bg-sky-50 text-sky-600 border-sky-100';
    if (s.includes('logistics') || s.includes('ship')) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header Block with Statistics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_5px_22px_rgba(0,0,0,0.015)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 border border-blue-100 text-[#1a56db] text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">
              Super Admin Control Plane
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">
            Businesses Directory
          </h1>
          <p className="text-xs text-slate-450 font-medium">
            Deploy, monitor, modify and audit corporate multi-tenant spaces within Blih CORE.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => onDraftAiSuggestion("Draft a multi-tenant business consolidation blueprint outlining access controls for super admins.")}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100/70 text-blue-700 hover:text-blue-800 transition-colors px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Setup Guideline</span>
          </button>
          
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-[#1a56db] hover:bg-[#124bbf] font-bold text-white transition-all hover:shadow-md px-4 py-2 rounded-xl text-xs cursor-pointer select-none"
          >
            <Plus className="w-4 h-4" />
            <span>Register Business</span>
          </button>
        </div>
      </div>

      {/* Grid of Micro KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Registered Enterprises', val: businesses.length, desc: 'Across Blih Cluster', icon: Building2, color: 'text-blue-600' },
          { label: 'Active Domains', val: businesses.filter(b => b.status === 'Active').length, desc: 'SSO routing enabled', icon: Globe, color: 'text-emerald-650' },
          { label: 'Combined Workforce', val: businesses.reduce((acc, current) => acc + current.employeeCount, 0).toLocaleString(), desc: 'Employees consolidated', icon: Users, color: 'text-violet-650' },
          { label: 'Active Licensing', val: 'A Grade Cluster', desc: 'Secure cloud instance', icon: Layers, color: 'text-amber-600' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-[0_5px_15px_rgba(0,0,0,0.01)] hover:-translate-y-0.5 transition-transform">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <div className="text-lg font-black text-slate-900 leading-none">{kpi.val}</div>
              <span className="text-[10.5px] text-slate-400 font-medium block">{kpi.desc}</span>
            </div>
            <div className={`p-2 bg-slate-50 rounded-xl ${kpi.color}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Tenant List panel */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_5px_22px_rgba(0,0,0,0.01)]">
        
        {/* Sub-header controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by corporate name, legal register, sector or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/40 focus:bg-white px-9 py-2.5 border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all"
            />
          </div>

          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <span>Displaying {filteredBusinesses.length} of {businesses.length} records</span>
          </div>
        </div>

        {/* List View Table */}
        {filteredBusinesses.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Building className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">No Enterprise tenants found</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">None of the configured companies match your search parameters. Try adjusting filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 select-none">
                  <th className="py-3 px-6">Company / Legal Entity</th>
                  <th className="py-3 px-4">Cluster Sector</th>
                  <th className="py-3 px-4">Infrastructure Domain</th>
                  <th className="py-3 px-4 text-center">Workforce Scale</th>
                  <th className="py-3 px-4">License Plan</th>
                  <th className="py-3 px-4">Gateway Status</th>
                  <th className="py-3 px-6 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredBusinesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-100 flex-shrink-0 shadow-inner">
                          {biz.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block tracking-tight leading-snug">{biz.name}</span>
                          <span className="text-[10.5px] text-slate-450 block font-medium mt-0.5">{biz.legalName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4.5 px-4 font-semibold">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${getSectorBadgeColor(biz.sector)}`}>
                        {biz.sector}
                      </span>
                    </td>

                    <td className="py-4.5 px-4 font-mono font-bold text-slate-500">
                      <div className="flex items-center gap-1 hover:text-[#1a56db] transition-all">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>{biz.domain}</span>
                      </div>
                    </td>

                    <td className="py-4.5 px-4 text-center font-bold text-slate-700">
                      <span>{biz.employeeCount} active</span>
                    </td>

                    <td className="py-4.5 px-4">
                      <div className="space-y-0.5">
                        <span className={`font-bold block text-[11px] ${
                          biz.tier === 'Enterprise' ? 'text-indigo-600' : 
                          biz.tier === 'Corporate' ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {biz.tier}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">Since {biz.established}</span>
                      </div>
                    </td>

                    <td className="py-4.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          biz.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'
                        }`} />
                        <span className={`font-bold uppercase tracking-wider text-[10px] ${
                          biz.status === 'Active' ? 'text-emerald-700' : 'text-red-650'
                        }`}>
                          {biz.status}
                        </span>
                      </div>
                    </td>

                    <td className="py-4.5 px-6 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => openEditModal(biz)}
                          title="Modify Configurations"
                          className="p-1 px-2.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(biz.id, biz.name)}
                          title="Terminate Instance"
                          className="p-1 px-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- BUSINESS PARAMETERS MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100/50 z-20 space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-secondary-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1a56db] flex items-center justify-center">
                    <Building2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-black text-slate-900 leading-tight">
                      {editingBusiness ? 'Customize Business Configurations' : 'Register New Tenancy Instance'}
                    </h4>
                    <span className="text-[10px] text-slate-450 block font-medium mt-0.5">Parameters map cleanly to secure routing layers</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commercial Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Apex Biotech"
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 placeholder-slate-400 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Legal Registered Entity</label>
                    <input
                      type="text"
                      required
                      value={formLegalName}
                      onChange={(e) => setFormLegalName(e.target.value)}
                      placeholder="e.g. Apex Biotech Solutions LLC"
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 placeholder-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commercial Domain</label>
                    <input
                      type="text"
                      required
                      value={formDomain}
                      onChange={(e) => setFormDomain(e.target.value)}
                      placeholder="e.g. apex-biotech.com"
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 placeholder-slate-400 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Principal Workspace Contact</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. billing@apex-biotech.com"
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 placeholder-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sector Focus</label>
                    <input
                      type="text"
                      required
                      value={formSector}
                      onChange={(e) => setFormSector(e.target.value)}
                      placeholder="e.g. Aerospace, HR, Biotech"
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 placeholder-slate-400 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Headquarters / Location</label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. Tokyo, JP"
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 placeholder-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Licence Tier</label>
                    <select
                      value={formTier}
                      onChange={(e) => setFormTier(e.target.value as any)}
                      className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] font-semibold text-xs text-slate-700 cursor-pointer"
                    >
                      <option value="Enterprise">Enterprise Elite</option>
                      <option value="Corporate">Corporate Pro</option>
                      <option value="Developer">Developer Sandbox</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Routing Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] font-semibold text-xs text-slate-700 cursor-pointer"
                    >
                      <option value="Active">Active Route</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Starting Directory Scale</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10000}
                      value={formEmployeeCount}
                      onChange={(e) => setFormEmployeeCount(Number(e.target.value))}
                      className="w-full bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-semibold text-xs text-slate-700 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 text-slate-500 font-bold hover:bg-slate-50 leading-none py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="bg-[#1a56db] hover:bg-[#124bbf] font-bold text-white shadow-sm leading-none py-2.5 px-5 rounded-xl text-xs cursor-pointer select-none"
                  >
                    {editingBusiness ? 'Apply Config Parameters' : 'Deploy Tenant Instance'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
