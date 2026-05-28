/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { usePublicJobs } from '../../hooks/useJobRequests';
import { Briefcase, MapPin, Clock, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicCareersPage() {
    const { data: jobs, isLoading } = usePublicJobs();

    return (
        <div className="min-h-screen bg-[#fafbfc] font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Minimal Header */}
            <header className="bg-white border-b border-slate-100 py-6 px-8 sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Open Vacancies</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-8 py-16">
                {/* Hero */}
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter sm:text-5xl">
                        Join our mission to <span className="text-blue-600">redefine ERP.</span>
                    </h2>
                    <p className="text-slate-500 font-medium max-w-2xl mx-auto text-sm leading-relaxed">
                        We're looking for passionate individuals to help us build the next generation of global enterprise software. Explore our open roles below.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 animate-pulse">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Scanning local talent grid...</span>
                    </div>
                ) : !jobs || jobs.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-xs">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-8 h-8 text-slate-200" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No active postings right now</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto font-medium">Please check back soon or follow our LinkedIn for future updates.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {jobs.map((job) => (
                            <Link 
                                to={`/careers/${job.id}`} 
                                key={job.id}
                                className="group bg-white border border-slate-100 rounded-[32px] p-8 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                                
                                <div className="relative z-10 space-y-6">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1a56db] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100/50 mb-3 block w-fit">
                                            {job.department}
                                        </span>
                                        <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                            {job.title}
                                        </h3>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{job.type}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>Remote Friendly</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between group-hover:border-blue-100 transition-colors">
                                        <span className="text-xs font-bold text-slate-900">Full Details</span>
                                        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <footer className="bg-white border-t border-slate-100 py-12 mt-24">
                <div className="max-w-6xl mx-auto px-8 text-center space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">&copy; 2026 Blih CORE ERP Ecosystem</p>
                    <p className="text-[10px] text-slate-300 font-medium tracking-tight">Privacy Policy &nbsp; &bull; &nbsp; Terms of Service</p>
                </div>
            </footer>
        </div>
    );
}
