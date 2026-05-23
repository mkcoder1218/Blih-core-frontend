import React, { useState } from 'react';
import { Target, Search, Sliders, ChevronDown, Sparkles, TrendingUp, ArrowUpRight, ArrowDownRight, Edit3 } from 'lucide-react';

interface KpiItem {
  id: string;
  name: string;
  description: string;
  dept: string;
  owner: string;
  updateFreq: string;
  current: number;
  target: number;
  unit: string;
  isLowerBetter?: boolean;
  trend: number[]; // 6 month values
  aiSummary: string;
}

interface KpisTabProps {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function KpisTab({ onDraftAiSuggestion, showAlert }: KpisTabProps) {
  const [kpis, setKpis] = useState<KpiItem[]>([
    {
      id: "kpi-1",
      name: "Monthly Recurring Revenue (MRR)",
      description: "Predictable revenue stream from subscription-based products and services",
      dept: "Sales",
      owner: "Robert Chen",
      updateFreq: "Monthly",
      current: 128,
      target: 150,
      unit: "k$",
      trend: [90, 110, 115, 120, 125, 128],
      aiSummary: "Exceptional efficiency in customer acquisition. Current CAC 15% below target indicates highly effective marketing strategies and channel optimization."
    },
    {
      id: "kpi-2",
      name: "Data Processing Speed",
      description: "Average time to process and generate insights from raw data sources",
      dept: "Analytics",
      owner: "Dr. Samantha Lee",
      updateFreq: "Weekly",
      current: 12,
      target: 15,
      unit: "min",
      isLowerBetter: true,
      trend: [18, 16, 15, 14, 13, 12],
      aiSummary: "Data team successfully completed streaming pipelines optimization. Data latency reduced, clearing bottlenecks for automated marketing CRM campaign systems."
    },
    {
      id: "kpi-3",
      name: "Code Quality Index",
      description: "Automated test coverage and structural lint integrity metrics",
      dept: "Engineering",
      owner: "John Smith",
      updateFreq: "Weekly",
      current: 88,
      target: 90,
      unit: "%",
      trend: [80, 82, 85, 86, 88, 88],
      aiSummary: "Maintained steady gains in testing coverage. Minor tech debt in legacy modules needs resolution in final weeks to prevent regression."
    },
    {
      id: "kpi-4",
      name: "Lead Generation Volume",
      description: "Qualified inbound marketing contacts generated monthly",
      dept: "Marketing",
      owner: "Sarah Johnson",
      updateFreq: "Monthly",
      current: 2450,
      target: 2000,
      unit: "leads",
      trend: [1800, 1900, 1950, 2100, 2300, 2450],
      aiSummary: "Inbound content strategy exceeded all monthly forecasting targets. Lead quality scores remain above benchmark average, fueling Q2 recruitment targets."
    }
  ]);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<string>('');

  // Sorter / Math Calculations
  const getProgressPercent = (kpi: KpiItem) => {
    if (kpi.isLowerBetter) {
      // e.g. target is 15min, current is 12min. Performance is: 15 / 12 = 1.25 -> 125%
      return Math.round((kpi.target / kpi.current) * 100);
    }
    return Math.round((kpi.current / kpi.target) * 100);
  };

  const isExceeding = (kpi: KpiItem) => {
    const percent = getProgressPercent(kpi);
    return percent >= 100;
  };

  const totalKpisCount = kpis.length;
  const avgCompletionRate = Math.round(
    kpis.reduce((acc, kpi) => acc + getProgressPercent(kpi), 0) / kpis.length
  );
  const exceedingCount = kpis.filter(isExceeding).length;
  const belowCount = totalKpisCount - exceedingCount;

  // Save cell edit
  const saveMetricEdit = (id: string) => {
    const numeric = parseFloat(editVal);
    if (isNaN(numeric) || numeric < 0) {
      showAlert("Pls input a valid positive numeric KPI metric.", "error");
      return;
    }
    setKpis(prev =>
      prev.map(k => (k.id === id ? { ...k, current: numeric, trend: [...k.trend.slice(1), numeric] } : k))
    );
    setEditingId(null);
    showAlert("KPI Metric adjusted successfully in active database!", "success");
  };

  const startEditing = (kpi: KpiItem) => {
    setEditingId(kpi.id);
    setEditVal(kpi.current.toString());
  };

  const triggerKpiAiAnalysis = (kpi: KpiItem) => {
    const statusText = isExceeding(kpi) ? "Exceeding Target" : "Below Target";
    const promptText = `Provide a professional executive corporate optimization analysis regarding the KPI "${kpi.name}" under ${kpi.dept} unit. Current metric status: ${kpi.current}${kpi.unit} against a target of ${kpi.target}${kpi.unit} (${statusText}, progress achieved ${getProgressPercent(kpi)}%). Discuss bottlenecks and direct-deposit ROI impacts. Compose in 2 clear markdown paragraphs.`;
    onDraftAiSuggestion(promptText);
  };

  // Filters
  const filteredKpis = kpis.filter(k => {
    const matchesSearch = k.name.toLowerCase().includes(searchTerm.toLowerCase()) || k.dept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || k.dept === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div id="kpis-tab-panel" className="space-y-5">
      {/* 4 Stats Cards counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total KPIs</span>
            <span className="text-xl font-extrabold text-slate-850 block mt-1">{totalKpisCount}</span>
          </div>
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Avg Score Rate</span>
            <span className="text-xl font-extrabold text-[#1a56db] block mt-1">{avgCompletionRate}%</span>
          </div>
          <div className="w-9 h-9 bg-blue-50 text-[#1a56db] rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Exceeding Target</span>
            <span className="text-xl font-extrabold text-slate-90 block mt-1 text-emerald-500">{exceedingCount}</span>
          </div>
          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-emerald-650" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Below Target</span>
            <span className="text-xl font-extrabold text-amber-500 block mt-1">{belowCount}</span>
          </div>
          <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4 text-amber-600" />
          </div>
        </div>
      </div>

      {/* KPI Controls filter header bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-3xs">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search KPIs name or metadata..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white"
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl py-2 pl-3.5 pr-8 text-xs font-bold text-slate-600 cursor-pointer focus:outline-none"
          >
            <option value="All">All Department Zones</option>
            <option value="Sales">Sales</option>
            <option value="Analytics">Analytics</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Cards list columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredKpis.map((kpi) => {
          const completionPercent = getProgressPercent(kpi);
          const exceeds = isExceeding(kpi);

          return (
            <div
              key={kpi.id}
              className="bg-white border border-slate-100 hover:border-slate-200 rounded-3xl p-5 shadow-3xs hover:shadow-2xs transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Info labels row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {kpi.dept}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      exceeds ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {exceeds ? 'Exceeding Target' : 'Below Target'}
                    </span>
                    <span className="bg-slate-50 border border-slate-150 text-[9px] font-extrabold text-slate-500 rounded p-0.5 px-1 bg-clip-text flex items-center gap-0.5 uppercase tracking-wide">
                      ⚡ Trending
                    </span>
                  </div>
                </div>

                {/* Name */}
                <h4 className="text-xs font-black text-slate-900 mt-2.5 leading-tight tracking-tight">
                  {kpi.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium leading-snug mt-1 max-w-sm">
                  {kpi.description}
                </p>

                <p className="text-[10px] text-slate-400 font-bold leading-none mt-2.5 uppercase tracking-wide">
                  Owner: {kpi.owner} • Updated {kpi.updateFreq}
                </p>
              </div>

              {/* Progress and value modifier box */}
              <div className="bg-slate-5/40 p-4 rounded-2xl border border-slate-100/60 font-sans">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100/60">
                  {/* Performance metric numbers */}
                  <div className="flex items-center gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold text-slate-405 uppercase block">Current</span>
                      
                      {editingId === kpi.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveMetricEdit(kpi.id)}
                            className="w-12 text-xs font-extrabold bg-white border border-blue-400 rounded p-0.5 px-1 py-1 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveMetricEdit(kpi.id)}
                            className="bg-blue-600 text-white font-extrabold text-[10px] p-0.5 px-1.5 rounded hover:bg-blue-700"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black text-slate-850">
                            {kpi.current}{kpi.unit}
                          </span>
                          <button
                            onClick={() => startEditing(kpi)}
                            className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
                            title="Edit Metric Value"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5 text-center">
                      <span className="text-[8px] font-bold text-slate-405 uppercase block">Target</span>
                      <span className="text-xs font-black text-slate-850">
                        {kpi.target}{kpi.unit}
                      </span>
                    </div>
                  </div>

                  {/* Calculated percentage gauge text */}
                  <div className="text-right">
                    <span className="text-[8px] font-bold text-slate-405 block uppercase">Progress to Target</span>
                    <span className="text-xs font-black text-blue-600">{completionPercent}%</span>
                  </div>
                </div>

                {/* Progress Visual bar */}
                <div className="mt-3 bg-slate-150 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(completionPercent, 100)}%` }}
                    className={`h-full ${exceeds ? 'bg-blue-600' : 'bg-blue-500'}`}
                  />
                </div>
              </div>

              {/* Sparkline & AI Insights section */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
                {/* Monthly Sparkline block (2 columns) */}
                <div className="sm:col-span-2 space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">6-Month Trend</span>
                  
                  <div className="flex items-end justify-between h-9 bg-slate-50 rounded-lg p-1.5 px-2 px-3 gap-0.5 border border-slate-100">
                    {kpi.trend.map((val, i) => {
                      const maxTrendVal = Math.max(...kpi.trend);
                      const barPercentage = Math.round((val / maxTrendVal) * 100);
                      return (
                        <div key={i} className="flex-1 h-full flex flex-col justify-end group cursor-help relative">
                          <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold px-1 rounded pointer-events-none transition-all z-10">
                            {val}
                          </span>
                          <div
                            style={{ height: `${Math.max(barPercentage, 20)}%` }}
                            className="bg-blue-500 hover:bg-blue-600 rounded-xs transition-all w-3 mx-auto"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Executive Summarizer action block (3 columns) */}
                <div className="sm:col-span-3 space-y-1.5 bg-blue-50/10 border border-blue-50/50 p-2 py-2.5 rounded-xl">
                  <div className="flex justify-between items-center leading-none mb-1">
                    <span className="text-[9px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-600 fill-blue-600" />
                      AI Analysis Summary
                    </span>
                    <button
                      onClick={() => triggerKpiAiAnalysis(kpi)}
                      className="text-[8px] font-extrabold text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      Re-Analyze
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-650 leading-tight font-medium line-clamp-2">
                    {kpi.aiSummary}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
