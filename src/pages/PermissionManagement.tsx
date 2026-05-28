import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ChevronRight,
  Search,
  Lock,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  ArrowRightLeft
} from 'lucide-react';
import { useRoles, useRoleDetails } from '../hooks/useRoles';
import { usePermissions, useSeedPermissions, useAssignPermissions, Permission } from '../hooks/usePermissions';

export default function PermissionManagement() {
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: allPermissions, isLoading: permsLoading } = usePermissions();
  const seedPerms = useSeedPermissions();
  const assignPerms = useAssignPermissions();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const { data: roleDetails, isLoading: detailsLoading } = useRoleDetails(selectedRoleId);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'available'>('all');

  // Local state for permissions assignment
  const [assignedKeys, setAssignedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (roleDetails) {
      setAssignedKeys(roleDetails.Permissions?.map(p => p.key) || []);
    }
  }, [roleDetails]);

  const togglePermission = (key: string) => {
    setAssignedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    if (!selectedRoleId) return;
    assignPerms.mutate({ roleId: selectedRoleId, permissionKeys: assignedKeys });
  };

  const filteredPermissions = allPermissions?.filter(p =>
    p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayPermissions = filteredPermissions?.filter(p => {
    if (activeTab === 'assigned') return assignedKeys.includes(p.key);
    if (activeTab === 'available') return !assignedKeys.includes(p.key);
    return true;
  });

  const handleDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData('permissionKey', key);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const key = e.dataTransfer.getData('permissionKey');
    if (key && !assignedKeys.includes(key)) {
      togglePermission(key);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Access Control</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">Define and assign system permissions to user roles.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => seedPerms.mutate()}
            disabled={seedPerms.isPending}
            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${seedPerms.isPending ? 'animate-spin' : ''}`} />
            Seed Defaults
          </button>
          <button
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Role
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Roles List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">System Roles</h2>
            </div>
            <div className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
              {rolesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-2xl m-2" />
                ))
              ) : (
                roles?.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${selectedRoleId === role.id
                      ? 'bg-blue-50/50 text-blue-600 ring-1 ring-blue-100'
                      : 'hover:bg-slate-50 text-slate-600'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selectedRoleId === role.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white'
                        }`}>
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold block">{role.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{role.key}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedRoleId === role.id ? 'translate-x-1' : 'opacity-0'}`} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Permissions Assignment */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {!selectedRoleId ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[40px] border border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <ArrowRightLeft className="w-10 h-10" />
                </div>
                <div className="max-w-xs transition-all">
                  <h3 className="text-lg font-black text-slate-900">No Role Selected</h3>
                  <p className="text-sm text-slate-400 font-medium mt-1 transition-all">Select a role from the left to manage its permissions and access levels.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selectedRoleId}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col min-h-[600px]"
              >
                {/* Assignment Header */}
                <div className="p-8 border-b border-slate-50 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{roleDetails?.name || 'Loading...'}</h2>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{roleDetails?.key}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={assignPerms.isPending || detailsLoading}
                      className="px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-black shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {assignPerms.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search permissions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'assigned', label: 'Assigned' },
                        { id: 'available', label: 'Available' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === tab.id
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Permissions Grid */}
                <div
                  className="p-8 flex-1 bg-slate-50/30"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  {permsLoading || detailsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {displayPermissions?.map((perm) => {
                        const isAssigned = assignedKeys.includes(perm.key);
                        return (
                          <motion.button
                            layout
                            draggable
                            onDragStart={(e) => handleDragStart(e as any, perm.key)}
                            key={perm.id}
                            onClick={() => togglePermission(perm.key)}
                            className={`p-3 rounded-xl text-left transition-all border group relative overflow-hidden flex flex-col justify-between h-full ${isAssigned
                              ? 'bg-blue-50/30 border-blue-100 shadow-3xs'
                              : 'bg-white border-slate-100 hover:border-slate-200 shadow-3xs'
                              }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 flex gap-2 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <div className={`shrink-0 transition-all ${isAssigned ? 'text-blue-600 scale-100' : 'text-slate-200 scale-75 opacity-0 group-hover:opacity-100'
                                    }`}>
                                    {isAssigned ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                  </div>
                                </div>
                                <div className="">
                                  <h4 className="text-[11px] font-black text-slate-900 truncate tracking-tight mb-1">{perm.key}</h4>
                                  <p className="text-[9px] font-medium text-slate-400 line-clamp-1 leading-tight">{perm.description || 'No description'}</p>
                                </div>

                              </div>

                            </div>

                            {isAssigned && (
                              <motion.div
                                layoutId="active-indicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {displayPermissions?.length === 0 && !permsLoading && (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                        <Search className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase">No Matches Found</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Try adjusting your search or filters.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600 shadow-lg shadow-blue-200" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{assignedKeys.length} Assigned</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{(allPermissions?.length || 0) - assignedKeys.length} Available</span>
                    </div>
                  </div>
                  {assignPerms.isSuccess && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-emerald-600"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Changes Saved</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
