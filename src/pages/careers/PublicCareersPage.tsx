import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  MapPin,
  Clock,
  DollarSign,
  Building2,
  ArrowRight,
  Briefcase,
  Calendar,
  Globe,
  Mail,
  Sparkles,
} from 'lucide-react';
import { usePublicJobs } from '../../hooks/useJobRequests';

export default function PublicCareersPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { data, isLoading, error } = usePublicJobs(businessSlug);

  const business = data?.business;
  const jobs: any[] = data?.jobs || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading careers...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm px-8 py-12 bg-white rounded-3xl border border-slate-100 shadow-xl">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-slate-300" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Company Not Found</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              The careers page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans">
      {/* Header with business branding */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow"
            style={{ backgroundColor: business.primaryColor || '#3b82f6' }}
          >
            {business.name?.[0]?.toUpperCase() || 'B'}
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">{business.name}</h1>
            {business.tagline && (
              <p className="text-xs text-slate-400 font-medium">{business.tagline}</p>
            )}
          </div>
          {business.email && (
            <a
              href={`mailto:${business.email}`}
              className="ml-auto flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Contact
            </a>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter sm:text-5xl">
            Join{' '}
            <span style={{ color: business.primaryColor || '#3b82f6' }}>
              {business.name}
            </span>
          </h2>
          <p className="text-slate-500 font-medium max-w-xl mx-auto text-sm leading-relaxed">
            {business.tagline || `Explore open positions at ${business.name} and find your next opportunity.`}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{jobs.length} open position{jobs.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Jobs */}
        {jobs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No open positions right now</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto font-medium leading-relaxed">
              Check back soon — {business.name} will post new opportunities here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {jobs.map((job: any, i: number) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/careers/${businessSlug}/apply/${job.id}`}
                  className="group block bg-white border border-slate-100 rounded-[28px] p-7 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="flex-1 space-y-3">
                      {/* Department badge */}
                      <span
                        className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border w-fit block"
                        style={{
                          color: business.primaryColor || '#3b82f6',
                          backgroundColor: `${business.primaryColor || '#3b82f6'}15`,
                          borderColor: `${business.primaryColor || '#3b82f6'}30`,
                        }}
                      >
                        {job.department || 'General'}
                      </span>

                      <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>

                      <div className="flex flex-wrap gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{job.type || 'Full-time'}</span>
                        </div>
                        {job.dueDate && job.dueDate !== 'TBD' && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Deadline: {job.dueDate}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{job.positions} position{job.positions !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {job.overview && job.overview !== 'No overview provided.' && (
                        <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">
                          {job.overview}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-4 shrink-0">
                      <span
                        className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${
                          job.priority === 'High'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {job.priority === 'High' ? 'Urgent' : 'Open'}
                      </span>
                      <div
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors"
                        style={{ color: business.primaryColor || '#3b82f6' }}
                      >
                        Apply
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 mt-20">
        <div className="max-w-5xl mx-auto px-8 py-8 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} {business.name}. All rights reserved.
          </p>
          <p className="text-xs text-slate-300 font-medium">Powered by Blih</p>
        </div>
      </footer>
    </div>
  );
}
