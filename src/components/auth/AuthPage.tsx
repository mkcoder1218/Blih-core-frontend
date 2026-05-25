/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
}

const DEMO_ACCOUNTS = [
  {
    name: 'Super Administrator',
    email: 'admin@blihmarketing.com',
    role: 'Super Admin',
    initials: 'SA'
  },
  {
    name: 'Aytenew Yihunie',
    email: 'aytenew@blihmarketing.com',
    role: 'HR Manager',
    initials: 'AY'
  },
  {
    name: 'Jessica Parker',
    email: 'jessica@blihmarketing.com',
    role: 'Full Stack Developer',
    initials: 'JP'
  },
  {
    name: 'Eleanor Vance',
    email: 'eleanor@blihmarketing.com',
    role: 'Finance Manager',
    initials: 'EV'
  }
];

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword('enterprise_core_2026');
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        name: account.name,
        email: account.email,
        role: account.role
      });
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please specify your login credentials.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const matchedDemo = DEMO_ACCOUNTS.find(acc => acc.email.toLowerCase() === email.toLowerCase());
      if (matchedDemo) {
        onLoginSuccess({
          name: matchedDemo.name,
          email: matchedDemo.email,
          role: matchedDemo.role
        });
      } else {
        if (password.length < 4) {
          setErrorMsg('Password must be at least 4 characters.');
          return;
        }
        // Friendly ERP fallback allowing custom accounts
        const formattedName = email.split('@')[0];
        const capitalizedName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
        const isSuperAdminEmail = email.toLowerCase().includes('admin');
        onLoginSuccess({
          name: capitalizedName || 'Administrator',
          email: email,
          role: isSuperAdminEmail ? 'Super Admin' : 'HR Specialist'
        });
      }
    }, 600);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center font-sans p-4 select-none antialiased">
      
      <div className="w-full max-w-[400px] space-y-7">
        
        {/* Simple Brand Header aligned with Brand Colors */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 bg-[#1a56db] rounded-2xl text-white mb-1 shadow-sm shadow-blue-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xl font-medium tracking-tight text-slate-800">Blih</span>
            <span className="text-xl font-black text-[#1a56db] tracking-wider">CORE</span>
          </div>
          <p className="text-xs text-slate-450 font-medium">Simplify human resources, talent, & workplace workflows.</p>
        </div>

        {/* Main interactive form card with pristine micro-borders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Sign in to Workspace
            </h2>
            <p className="text-[11.5px] text-slate-400 leading-normal">
              Enter secure email and password parameters to gain central clearance.
            </p>
          </div>

          {/* Animate statuses */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-red-50/70 border border-red-100 rounded-xl p-3 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-red-700 font-medium leading-normal">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-emerald-700 font-medium leading-normal">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 bg-white">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@blihmarketing.com"
                  className="w-full bg-slate-50 hover:bg-slate-100/40 focus:bg-white px-9 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-medium text-xs text-slate-700 placeholder-slate-400 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Password</label>
                <button 
                  type="button" 
                  onClick={() => setSuccessMsg('Password reset instructions dispatched to account owner.')}
                  className="text-[10px] font-bold text-slate-400 hover:text-[#1a56db] transition-colors cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 hover:bg-slate-100/40 focus:bg-white px-9 py-2.5 rounded-xl border border-slate-200/80 focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] focus:outline-none font-medium text-xs text-slate-700 placeholder-slate-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-98 mt-3 shadow-md shadow-blue-500/10"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin block" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Crisp Quick Presets section with Brand Matching Hover states */}
        <div className="space-y-3 pt-1">
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Quick Access Profiles</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2">
            {DEMO_ACCOUNTS.map((acc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickLogin(acc)}
                className="flex-1 bg-white hover:bg-blue-50/15 border border-slate-200/80 hover:border-blue-300 rounded-xl p-2.5 text-center transition-all active:scale-98 cursor-pointer flex items-center sm:flex-col justify-start sm:justify-center gap-2.5 sm:gap-1.5 group animate-fade-in"
              >
                <div className="w-6 h-6 rounded-full bg-blue-50 text-[#1a56db] text-[10px] font-bold flex items-center justify-center border border-blue-100/80 flex-shrink-0 group-hover:bg-[#1a56db] group-hover:text-white group-hover:border-transparent transition-all">
                  {acc.initials}
                </div>
                <div className="text-left sm:text-center min-w-0">
                  <span className="text-[11px] font-bold text-slate-700 block truncate leading-none group-hover:text-[#1a56db] transition-colors">{acc.name.split(' ')[0]}</span>
                  <span className="text-[9px] font-medium text-slate-400 block truncate mt-0.5 leading-none">{acc.role}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-mono tracking-wide">
          GATEWAY v4.8 • ESTABLISHED SECURE SSL
        </div>

      </div>
    </div>
  );
}
