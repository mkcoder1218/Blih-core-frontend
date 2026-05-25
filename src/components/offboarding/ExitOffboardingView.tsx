import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  FileText,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  ThumbsUp,
  PlusCircle,
  Search,
  AlertCircle,
  Trash2,
  Edit2,
  Download,
  Check,
  Send,
  User,
  Users,
  Building2,
  BookOpen,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  FileSpreadsheet,
  X,
  FileSignature
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';

interface ExitOffboardingViewProps {
  currentTab: 'overview' | 'resign' | 'interviews' | 'documents' | 'clearance' | 'forms';
  onDraftAiSuggestion: (ctx: string) => void;
  showAlert: (msg: string, type: 'success' | 'error') => void;
}

export default function ExitOffboardingView({
  currentTab,
  onDraftAiSuggestion,
  showAlert,
}: ExitOffboardingViewProps) {
  // Mock internal states to enable high fidelity real-time CRUD and interactive toggles

  // 1. Overview state
  const [warnings, setWarnings] = useState([
    {
      id: 1,
      name: 'Mark Kim',
      dept: 'Development',
      priority: 'high',
      initials: 'MK',
      text: 'Project deliverables due next week.',
      date: '2024-02-15',
      remaining: '30 days remaining'
    },
    {
      id: 2,
      name: 'Linda Tars',
      dept: 'Design',
      priority: 'low',
      initials: 'LT',
      text: 'Additional feedback requested for final design.',
      date: '2024-02-20',
      remaining: '31 days remaining'
    },
    {
      id: 3,
      name: 'Sarah Johnson',
      dept: 'Marketing',
      priority: 'urgent',
      initials: 'SJ',
      text: 'Resignation letter received - 30 days notice period started.',
      date: '2024-02-18',
      remaining: '25 days remaining'
    }
  ]);

  // 2. Resignations state
  const [resignations, setResignations] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Marketing Manager',
      dept: 'Marketing',
      initials: 'SJ',
      submittedDate: '2024-02-18',
      lastWorkingDay: '2024-03-20',
      noticePeriod: '30 days',
      reason: 'Better career opportunity',
      status: 'pending', // 'pending' | 'approved' | 'revision'
      letterText: 'Dear HR Manager,\n\nI am writing to formally notify you of my resignation from my position as Marketing Manager at the company. My last working day will be March 20, 2024, providing the required 30-days notice.\n\nThank you for the support during my tenure there.'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Senior Engineer',
      dept: 'Engineering',
      initials: 'MC',
      submittedDate: '2024-02-19',
      lastWorkingDay: '2024-03-20',
      noticePeriod: '30 days',
      reason: 'Better career opportunity',
      status: 'approved',
      letterText: 'Dear HR Department,\n\nI am writing to inform you of my decision to resign from my position as Senior Engineer. My last day of work will be March 12, 2024.\n\nDue to family circumstances, I will be relocating to another city. Thank you for the growth opportunities.'
    }
  ]);

  // 3. Exit Interviews state
  const [upcomingInterviews, setUpcomingInterviews] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      dept: 'Marketing Manager',
      initials: 'SJ',
      date: '2024-03-22',
      time: '10:00 AM',
      interviewer: 'Jennifer Smith',
      location: 'Conference Room A',
      status: 'scheduled'
    },
    {
      id: 2,
      name: 'Michael Chen',
      dept: 'Senior Engineer',
      initials: 'MC',
      date: '2024-03-24',
      time: '02:00 PM',
      interviewer: 'Jennifer Smith',
      location: 'Virtual Call',
      status: 'scheduled'
    }
  ]);

  const [completedInterviews, setCompletedInterviews] = useState([
    {
      id: 1,
      name: 'Jessica Parker',
      role: 'Full Stack Developer',
      dept: 'TECHNICAL DEPT.',
      initials: 'JP',
      date: '2024-03-15',
      interviewer: 'Jennifer Smith',
      rating: 4.5,
      recommend: 'Yes',
      remarks: 'Employee leaving for better compensation. Suggested reviewing salary benchmarks for engineering roles.'
    },
    {
      id: 2,
      name: 'Alan Turing',
      role: 'Lead Architect',
      dept: 'TECHNICAL DEPT.',
      initials: 'AT',
      date: '2024-03-10',
      interviewer: 'Marcus Vance',
      rating: 4.0,
      recommend: 'Yes',
      remarks: 'Highly satisfied with technology choices but felt professional advancement pathways could be accelerated.'
    },
    {
      id: 3,
      name: 'Sophia Loren',
      role: 'HR Specialist',
      dept: 'HR DEPT.',
      initials: 'SL',
      date: '2024-03-02',
      interviewer: 'Jennifer Smith',
      rating: 4.8,
      recommend: 'Yes',
      remarks: 'Praised core supportive culture and leadership accessibility. Leaving due to geographic relocation.'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showLogInterviewModal, setShowLogInterviewModal] = useState(false);
  const [newInterview, setNewInterview] = useState({
    name: '',
    role: '',
    dept: 'TECHNICAL DEPT.',
    interviewer: 'Jennifer Smith',
    rating: '5',
    recommend: 'Yes',
    remarks: ''
  });

  // 4. Documents state
  const [employeeDocs, setEmployeeDocs] = useState([
    {
      id: 1,
      name: 'Michael Chen',
      dept: 'Engineering',
      initials: 'MC',
      lastWorkingDay: '2024-03-12',
      checklist: {
        clearanceLetter: true,
        idCard: true,
        emergencyContact: true,
        guarantorInfo: true,
        experienceLetter: false
      }
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      dept: 'Marketing',
      initials: 'SJ',
      lastWorkingDay: '2024-03-20',
      checklist: {
        clearanceLetter: true,
        idCard: false,
        emergencyContact: true,
        guarantorInfo: false,
        experienceLetter: false
      }
    }
  ]);

  // 5. Clearance Checklist state
  const [clearances, setClearances] = useState([
    {
      id: 1,
      name: 'Michael Chen',
      role: 'Senior Engineer',
      dept: 'Engineering',
      initials: 'MC',
      status: 'completed', // 'completed' | 'in progress'
      lastWorkingDay: '2024-03-12',
      steps: {
        1: { title: 'Resignation Letter Received & Signed', completed: true, date: '2024-02-10', by: 'HR Team' },
        2: { title: 'Exit Interview Completed', completed: true, date: '2024-02-15', by: 'Jennifer Smith' },
        3: { title: 'Assets & Credentials Returned', completed: true, date: '2024-02-14', by: 'IT Department' },
        4: { title: 'Last Payment Settled', completed: true, date: '2024-02-16', by: 'Finance Team' },
        5: { title: 'Experience Letter Issued', completed: true, date: '2024-02-15', by: 'HR Manager' },
        6: { title: 'Recommendation Letter (if applicable)', completed: true, date: '2024-02-16', by: 'Department Head' }
      }
    },
    {
      id: 2,
      name: 'Emily Rodriguez',
      role: 'Senior Engineer',
      dept: 'Engineering',
      initials: 'ER',
      status: 'in progress',
      lastWorkingDay: '2024-03-22',
      steps: {
        1: { title: 'Resignation Letter Received & Signed', completed: true, date: '2024-02-10', by: 'HR Team' },
        2: { title: 'Exit Interview Completed', completed: true, date: '2024-02-15', by: 'Jennifer Smith' },
        3: { title: 'Assets & Credentials Returned', completed: false, date: null, by: null },
        4: { title: 'Last Payment Settled', completed: true, date: '2024-02-16', by: 'Finance Team' },
        5: { title: 'Experience Letter Issued', completed: false, date: null, by: null },
        6: { title: 'Recommendation Letter (if applicable)', completed: true, date: '2024-02-18', by: 'Department Head' }
      }
    }
  ]);

  // Chart Data definitions for Recharts
  const exitReasonsData = [
    { name: 'Better Opportunity', count: 19 },
    { name: 'Career Growth', count: 14 },
    { name: 'Compensation', count: 12 },
    { name: 'Work-Life Balance', count: 8 },
    { name: 'Relocation', count: 6 },
    { name: 'Personal Reasons', count: 4 }
  ];

  const turnoverTrendData = [
    { month: 'Aug', Exits: 3, Hires: 7 },
    { month: 'Sep', Exits: 4, Hires: 5 },
    { month: 'Oct', Exits: 2, Hires: 6 },
    { month: 'Nov', Exits: 5, Hires: 8 },
    { month: 'Dec', Exits: 3, Hires: 4 },
    { month: 'Jan', Exits: 6, Hires: 9 },
    { month: 'Feb', Exits: 5, Hires: 7 }
  ];

  const departmentsData = [
    { name: 'Engineering', employees: 45, exits: 3, rate: 6.7 },
    { name: 'Design', employees: 18, exits: 1, rate: 5.6 },
    { name: 'Marketing', employees: 21, exits: 3, rate: 14.2 },
    { name: 'Analytics', employees: 15, exits: 2, rate: 13.3 },
    { name: 'Sales', employees: 31, exits: 4, rate: 12.5 },
    { name: 'HR', employees: 12, exits: 0, rate: 0.0 }
  ];

  // Helper actions

  const handleApproveResign = (id: number) => {
    setResignations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'approved' } : r)
    );
    showAlert('Resignation letter approved successfully!', 'success');
  };

  const handleRequestRevision = (id: number) => {
    setResignations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'revision' } : r)
    );
    showAlert('Revision requested for delegation checklist.', 'success');
  };

  const handleSendInterviewReminder = (name: string) => {
    showAlert(`Graceful reminder email dispatched to ${name}!`, 'success');
  };

  const handleRescheduleInterview = (name: string) => {
    showAlert(`Reschedule invitation generated for ${name}.`, 'success');
  };

  const submitLoggedInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterview.name || !newInterview.role) {
      showAlert('Please enter employee name & role', 'error');
      return;
    }
    const created = {
      id: completedInterviews.length + 1,
      name: newInterview.name,
      role: newInterview.role,
      dept: newInterview.dept,
      initials: newInterview.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      date: new Date().toISOString().split('T')[0],
      interviewer: newInterview.interviewer,
      rating: parseFloat(newInterview.rating),
      recommend: newInterview.recommend,
      remarks: newInterview.remarks || 'Standard departure. No grievances recorded.'
    };
    setCompletedInterviews([created, ...completedInterviews]);
    setShowLogInterviewModal(false);
    setNewInterview({
      name: '',
      role: '',
      dept: 'TECHNICAL DEPT.',
      interviewer: 'Jennifer Smith',
      rating: '5',
      recommend: 'Yes',
      remarks: ''
    });
    showAlert('Exit interview logged safely!', 'success');
  };

  const toggleDocumentCheck = (empId: number, docKey: string) => {
    setEmployeeDocs(prev =>
      prev.map(emp => {
        if (emp.id === empId) {
          const checklist = { ...emp.checklist } as any;
          checklist[docKey] = !checklist[docKey];
          return { ...emp, checklist };
        }
        return emp;
      })
    );
    showAlert('Document status toggled.', 'success');
  };

  const toggleClearanceStep = (empId: number, stepNum: number) => {
    setClearances(prev =>
      prev.map(cl => {
        if (cl.id === empId) {
          const updatedSteps = { ...cl.steps } as any;
          const currentStep = updatedSteps[stepNum];
          const newCompleted = !currentStep.completed;

          updatedSteps[stepNum] = {
            ...currentStep,
            completed: newCompleted,
            date: newCompleted ? new Date().toISOString().split('T')[0] : null,
            by: newCompleted ? 'Jennifer Smith' : null
          };

          // Recalculate status
          const allDone = Object.values(updatedSteps).every((s: any) => s.completed);
          const newStatus = allDone ? 'completed' : 'in progress';

          if (allDone && cl.status !== 'completed') {
            setTimeout(() => {
              showAlert(`Congratulations! Clearance for ${cl.name} completed successfully!`, 'success');
            }, 50);
          }

          return {
            ...cl,
            steps: updatedSteps,
            status: newStatus
          };
        }
        return cl;
      })
    );
  };

  // Filter completed exit interviews
  const filteredCompletedInterviews = completedInterviews.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.remarks.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans">
      {/* 1. OVERVIEW VIEW */}
      {currentTab === 'overview' && (
        <div className="space-y-8">
          {/* Top Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Active Resignations</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-800">8</span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between h-full py-1">
                <span className="bg-blue-50 text-blue-600 font-bold text-[10px] px-2 py-0.5 rounded-full">+2 this month</span>
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Pending Interviews</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-800">5</span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between h-full py-1">
                <span className="bg-amber-50 text-amber-600 font-bold text-[10px] px-2 py-0.5 rounded-full">2 scheduled</span>
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Clearance Pending</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-800">12</span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between h-full py-1">
                <span className="bg-red-50 text-red-600 font-bold text-[10px] px-2 py-0.5 rounded-full">4 urgent</span>
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Completed This Month</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-800">6</span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between h-full py-1">
                <span className="bg-emerald-50 text-emerald-600 font-bold text-[10px] px-2 py-0.5 rounded-full">2 pending</span>
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Active Resignation Notifications warnings block */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Active Resignation Notifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warnings.map(item => {
                const isHighUrgent = item.priority === 'high' || item.priority === 'urgent';
                return (
                  <div
                    key={item.id}
                    className={`bg-white p-4.5 rounded-2xl flex gap-4 transition-all hover:shadow-sm border ${
                      isHighUrgent ? 'border-red-100 bg-red-50/5' : 'border-slate-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                      {item.initials}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{item.name}</span>
                          <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                            {item.dept}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.2 rounded-md ${
                            item.priority === 'urgent'
                              ? 'bg-red-500 text-white'
                              : item.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-normal">{item.text}</p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1 font-mono">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.date}
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-blue-600">
                          <Clock className="w-3.5 h-3.5" />
                          {item.remaining}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Resignations Overview list */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Active Resignations Overview</h3>
            <div className="divide-y divide-slate-100">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 bg-slate-50/40 p-4 rounded-xl border border-slate-100/60 mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold font-mono">SJ</div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider font-mono">Sarah Johnson <span className="text-slate-300 font-normal">|</span> Marketing</span>
                    <span className="text-sm font-bold text-slate-800">Marketing Manager</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 mt-4 md:mt-0 font-mono text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Resignation Date</span>
                    <span className="font-semibold text-slate-600">2024-02-18</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Last Working Day</span>
                    <span className="font-semibold text-slate-600">2024-03-20</span>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Days Remaining</span>
                    <span className="font-bold text-blue-600">25 days</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <span className="bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full inline-block">
                    Interview pending
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 bg-slate-50/40 p-4 rounded-xl border border-slate-100/60 mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold font-mono">MC</div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider font-mono">Michael Chen <span className="text-slate-300 font-normal">|</span> Engineering</span>
                    <span className="text-sm font-bold text-slate-800">Senior Engineer</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 mt-4 md:mt-0 font-mono text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Resignation Date</span>
                    <span className="font-semibold text-slate-600">2024-02-10</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Last Working Day</span>
                    <span className="font-semibold text-slate-600">2024-03-12</span>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Days Remaining</span>
                    <span className="font-bold text-blue-600">18 days</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <span className="bg-[#1e40af] text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full inline-block">
                    Interview progress
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 bg-slate-50/40 p-4 rounded-xl border border-slate-100/60">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold font-mono">ER</div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider font-mono">Emily Rodriguez <span className="text-slate-300 font-normal">|</span> Design</span>
                    <span className="text-sm font-bold text-slate-800">UI/UX Designer</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 mt-4 md:mt-0 font-mono text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Resignation Date</span>
                    <span className="font-semibold text-slate-600">2024-02-08</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Last Working Day</span>
                    <span className="font-semibold text-slate-600">2024-03-07</span>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Days Remaining</span>
                    <span className="font-bold text-blue-600">10 days</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <span className="bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full inline-block">
                    Clearance progress
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Graphical Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Top Exit Reasons (Last 12 Months)</h3>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={exitReasonsData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} fontClassName="font-mono" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={10}
                      width={100}
                    />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Monthly Turnover Trend</h3>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={turnoverTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} fontClassName="font-mono" />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="Hires" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Exits" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-500 font-mono text-center">
                <span>Total Hires: 46</span>
                <span className="text-red-500">Total Exits: 29</span>
              </div>
            </div>
          </div>

          {/* Department Attrition Analysis */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Department Attrition Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {departmentsData.map(dept => (
                <div key={dept.name} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:bg-slate-50/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{dept.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{dept.employees} employees</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 block font-mono">
                      {dept.exits} {dept.exits === 1 ? 'exit' : 'exits'} this year
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block font-mono">Attrition Rate</span>
                    <span className="text-2xl font-bold text-blue-600 font-mono">{dept.rate}%</span>
                    <span className="text-[10px] text-slate-400 block font-mono font-bold mt-1">
                      {dept.employees - dept.exits} remaining
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. RESIGN VIEW */}
      {currentTab === 'resign' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Received</span>
                <span className="text-3xl font-bold text-slate-800">3</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Pending Approval</span>
                <span className="text-3xl font-bold text-slate-800">1</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <Mail className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Approved</span>
                <span className="text-3xl font-bold text-slate-800">2</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">This Month</span>
                <span className="text-3xl font-bold text-slate-800">3</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Resignation Letters list */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Resignation Letters Received</h3>
            <div className="space-y-6">
              {resignations.map(letter => (
                <div key={letter.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* LHS Info block */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                          {letter.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800">{letter.name}</h4>
                            <span className="bg-slate-50 border border-slate-100 text-slate-500 font-mono text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {letter.dept}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-slate-500">{letter.role}</span>
                        </div>
                        <span
                          className={`ml-auto text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                            letter.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : letter.status === 'revision'
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}
                        >
                          {letter.status}
                        </span>
                      </div>

                      {/* Letter fields summary */}
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Submitted Date</span>
                          <span className="font-bold text-slate-700">{letter.submittedDate}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Last Working Day</span>
                          <span className="font-bold text-slate-700">{letter.lastWorkingDay}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Notice Period</span>
                          <span className="font-bold text-slate-700">{letter.noticePeriod}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Reason</span>
                          <span className="font-bold text-blue-600">{letter.reason}</span>
                        </div>
                      </div>
                    </div>

                    {/* RHS Actual Document preview block */}
                    <div className="flex-1 bg-slate-50/80 p-5 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                          <FileSignature className="w-3.5 h-3.5" />
                          Resignation Letter
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line bg-white p-4 rounded-lg border border-slate-100">
                          {letter.letterText}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-4 pt-1">
                        <button
                          onClick={() => handleApproveResign(letter.id)}
                          disabled={letter.status === 'approved'}
                          className={`flex-1 font-bold text-xs py-2.5 px-4 rounded-xl transition-all border ${
                            letter.status === 'approved'
                              ? 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 active:scale-95'
                          }`}
                        >
                          {letter.status === 'approved' ? 'Approved & Responded' : 'Approve & Respond'}
                        </button>
                        <button
                          onClick={() => handleRequestRevision(letter.id)}
                          disabled={letter.status === 'approved'}
                          className={`flex-1 font-bold text-xs py-2.5 px-4 rounded-xl transition-all border ${
                            letter.status === 'approved'
                              ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95'
                          }`}
                        >
                          Request Revision
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. INTERVIEWS VIEW */}
      {currentTab === 'interviews' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Scheduled</span>
                <span className="text-3xl font-bold text-slate-800">3</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Avg Rating</span>
                <span className="text-3xl font-bold text-slate-800">4.2/5.0</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Completed</span>
                <span className="text-3xl font-bold text-slate-800">3</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Upcoming Exit Interviews */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Upcoming Exit Interviews</h3>
              <button
                onClick={() => onDraftAiSuggestion('Exit Interview Questions & Strategic Guidance')}
                className="bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Draft Interview Checklist
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {upcomingInterviews.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold font-mono">
                      {item.initials}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">{item.name}</h4>
                      <span className="text-xs text-slate-400 font-mono font-medium">{item.dept}</span>
                    </div>
                    <span className="ml-auto bg-blue-50 text-blue-600 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md">
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono leading-relaxed">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Date</span>
                      <span className="font-semibold text-slate-700">{item.date}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Time</span>
                      <span className="font-semibold text-slate-700">{item.time}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Interviewer</span>
                      <span className="font-semibold text-slate-700">{item.interviewer}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Location</span>
                      <span className="font-semibold text-slate-700">{item.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => handleSendInterviewReminder(item.name)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Reminder
                    </button>
                    <button
                      onClick={() => handleRescheduleInterview(item.name)}
                      className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-xl transition-all"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Exit Interviews Section with Live Search & CRUD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-50 pb-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Completed Exit Interviews</h3>
                <p className="text-xs text-slate-400">View and archive historic feedback logs and organizational insights.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 outline-none rounded-xl w-[200px] focus:bg-white focus:border-blue-400 transition-all font-medium text-slate-800"
                  />
                </div>
                <button
                  onClick={() => setShowLogInterviewModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Log Exit Feedback
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredCompletedInterviews.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold border-2 border-dashed border-slate-100 rounded-xl">
                  No completed interviews matching the search.
                </div>
              ) : (
                filteredCompletedInterviews.map(item => (
                  <div key={item.id} className="bg-slate-50/40 p-5 rounded-2xl border border-slate-100">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold font-mono">
                          {item.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800 leading-tight">{item.name}</span>
                            <span className="bg-blue-50 text-blue-600 text-[9px] uppercase font-bold font-mono px-2 py-0.5 rounded">
                              {item.dept}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">{item.role}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 font-mono text-[11px] leading-relaxed">
                        <div>
                          <span className="block text-[9px] text-slate-400 font-bold uppercase">Interview Date</span>
                          <span className="font-semibold text-slate-700">{item.date}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 font-bold uppercase">Interviewer</span>
                          <span className="font-semibold text-slate-700">{item.interviewer}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 font-bold uppercase">Rating</span>
                          <span className="font-bold text-amber-500">{item.rating.toFixed(1)} / 5.0</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 lg:ml-auto font-mono text-[11px]">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Would Recommend</span>
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded">
                          {item.recommend}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Remarks</span>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                        {item.remarks}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. DOCUMENTS VIEW */}
      {currentTab === 'documents' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider font-mono">Total Employees</span>
                <span className="text-3xl font-bold text-slate-800">3</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider font-mono">Fully Cleared</span>
                <span className="text-3xl font-bold text-slate-800">1</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider font-mono">In Progress</span>
                <span className="text-3xl font-bold text-slate-800">2</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Employee Document Clearance list */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-sans pb-1">
              <div>
                <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Employee Document Clearance</h3>
                <p className="text-xs text-slate-400">Select and confirm required offboarding document checklists.</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-1.5 text-xs bg-slate-100 border-none outline-none rounded-xl w-[180px] focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-5">
              {employeeDocs.map(emp => {
                const checkedCount = Object.values(emp.checklist).filter(v => v).length;
                const totalCount = Object.keys(emp.checklist).length;
                const percent = Math.round((checkedCount / totalCount) * 100);

                return (
                  <div key={emp.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-6">
                    {/* Employee Profile Info */}
                    <div className="flex-1 lg:max-w-xs space-y-3 border-r border-slate-50 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                          {emp.initials}
                        </div>
                        <div>
                          <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[9px] uppercase font-bold font-mono px-2 py-0.5 rounded block max-w-max">
                            {emp.dept}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 mt-1 leading-none">{emp.name}</h4>
                        </div>
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 leading-normal">
                        <span className="block">Last Working Day: <span className="font-bold text-slate-700">{emp.lastWorkingDay}</span></span>
                      </div>
                    </div>

                    {/* Progress Checklist Checkboxes with High Fidelity interaction */}
                    <div className="flex-1 space-y-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Required Checklist Documents</span>
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          onClick={() => toggleDocumentCheck(emp.id, 'clearanceLetter')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all ${
                            emp.checklist.clearanceLetter
                              ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          clearance Letter
                        </button>

                        <button
                          onClick={() => toggleDocumentCheck(emp.id, 'idCard')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all ${
                            emp.checklist.idCard
                              ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          id Card
                        </button>

                        <button
                          onClick={() => toggleDocumentCheck(emp.id, 'emergencyContact')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all ${
                            emp.checklist.emergencyContact
                              ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          emergency Contact
                        </button>

                        <button
                          onClick={() => toggleDocumentCheck(emp.id, 'guarantorInfo')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all ${
                            emp.checklist.guarantorInfo
                              ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          guarantor info
                        </button>

                        <button
                          onClick={() => toggleDocumentCheck(emp.id, 'experienceLetter')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all ${
                            emp.checklist.experienceLetter
                              ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          experience Letter
                        </button>
                      </div>

                      {/* RHS visual completion bar */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => showAlert('Documents list saved successfully!', 'success')}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-4 py-1.5 rounded-xl transition-all shadow-sm"
                          >
                            Manage Documents
                          </button>
                          <button
                            onClick={() => showAlert('Starting archive compilation as ZIP...', 'success')}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold px-4 py-1.5 rounded-xl transition-all flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download All
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center xl:justify-center border-t xl:border-t-0 xl:border-l border-slate-100 pt-4 xl:pt-0 xl:pl-6">
                      <div className="text-center space-y-1 font-mono">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Completion Bar</span>
                        <div className="relative inline-flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full border-[3px] border-slate-100 flex items-center justify-center text-blue-600 font-extrabold text-sm relative">
                            {percent}%
                            <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 border-t-transparent animate-pulse opacity-40"></div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold block pt-1">
                          Overall Progress {checkedCount}/{totalCount} tasks
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document Templates section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Document Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: 'Recommendation Letter Template', desc: 'Template for employee recommendation' },
                { title: 'Invoice Template', desc: 'Template for billing clients' },
                { title: 'Meeting Agenda Template', desc: 'Template for organizing meeting discussions' }
              ].map((tmpl, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform space-y-3">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800 leading-normal">{tmpl.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{tmpl.desc}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <button
                      onClick={() => showAlert('Successfully downloaded format template!', 'success')}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recently Cleared Documents list */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Recently Cleared Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Michael Chen', clearedBy: 'Jennifer Smith', date: '2024-02-15' },
                { name: 'Michael Chen', clearedBy: 'Jennifer Smith', date: '2024-02-15' },
                { name: 'Michael Chen', clearedBy: 'Jennifer Smith', date: '2024-02-15' },
                { name: 'Michael Chen', clearedBy: 'Jennifer Smith', date: '2024-02-15' }
              ].map((doc, idx) => (
                <div key={idx} className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center font-mono">
                      MC
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 font-sans leading-tight">{doc.name}</h4>
                      <span className="text-[9px] text-slate-400 block font-mono">Cleared by {doc.clearedBy}</span>
                      <span className="text-[9px] text-slate-400 block font-mono">{doc.date}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => showAlert('Downloading document copy...', 'success')}
                    className="w-8 h-8 rounded-full hover:bg-slate-50/80 border border-slate-100 text-slate-500 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. CLEARANCE CHECKLIST VIEW */}
      {currentTab === 'clearance' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider font-mono">Total Employees</span>
                <span className="text-3xl font-bold text-slate-800">3</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider font-mono">Completed</span>
                <span className="text-3xl font-bold text-slate-800">1</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider font-mono">In Progress</span>
                <span className="text-3xl font-bold text-slate-800">1</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider font-mono">Pending</span>
                <span className="text-3xl font-bold text-slate-800">1</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <X className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Exit Clearance Checklist Template Overview */}
          <div className="bg-white p-6 rounded-2xl border border-blue-100 bg-blue-50/5 shadow-sm space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4" />
                Exit Clearance Checklist Template
              </span>
              <p className="text-xs text-slate-400">Standardized 6-stage operational tasks executed for every departing corporate employee.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {[
                { num: '1', title: 'Resignation Letter Received & Signed', desc: 'Official resignation letter submitted and acknowledged' },
                { num: '4', title: 'Last Payment Settled', desc: 'Final salary, benefits, and dues cleared' },
                { num: '2', title: 'Exit Interview Completed', desc: 'Exit interview conducted and documented' },
                { num: '5', title: 'Experience Letter Issued', desc: 'Official experience certificates provided' },
                { num: '3', title: 'Assets & Credentials Returned', desc: 'Company property, ID card, access cards, and equipment returned' },
                { num: '6', title: 'Recommendation Letter (if applicable)', desc: 'Letter of recommendation for future employment' }
              ].map(step => (
                <div key={step.num} className="bg-white p-4 rounded-xl border border-slate-100/80 shadow-sm/5 hover:border-slate-200 transition-all flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-extrabold text-xs flex items-center justify-center flex-shrink-0 font-mono">
                    {step.num}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-700 leading-normal">{step.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-snug">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Clearance Progress (Interactive checklist steps!) */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Employee Clearance Progress</h3>
            <div className="space-y-6">
              {clearances.map(cl => {
                const stepItems = Object.entries(cl.steps) as any[];
                const doneCount = stepItems.filter(([_, s]) => s.completed).length;
                const totalSteps = stepItems.length;
                const percent = Math.round((doneCount / totalSteps) * 100);

                return (
                  <div key={cl.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-50 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                          {cl.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800">{cl.name}</h4>
                            <span className="bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                              {cl.dept}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-semibold">{cl.role}</span>
                        </div>
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                            cl.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cl.status}
                        </span>
                      </div>
                      <span className="bg-slate-50 text-slate-500 text-[11px] font-mono font-bold px-3 py-1 rounded-lg border border-slate-100">
                        Progress: {percent}% completed
                      </span>
                    </div>

                    {/* Sequential checklist steps grid. Allows checking items dynamically. */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stepItems.map(([stepNumStr, step]) => {
                        const stepNum = parseInt(stepNumStr);
                        return (
                          <div
                            key={stepNum}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                              step.completed
                                ? 'bg-emerald-50/10 border-emerald-100'
                                : 'bg-slate-50/30 border-slate-200/60 hover:bg-slate-50/60'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {step.completed ? (
                                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white mt-0.5 flex-shrink-0">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-300 mt-0.5 flex-shrink-0">
                                  {stepNum}
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <span className={`text-xs font-bold block ${step.completed ? 'text-slate-700' : 'text-slate-500'}`}>
                                  {step.title}
                                </span>
                                {step.completed && (
                                  <span className="text-[9px] text-emerald-600 font-mono font-semibold block">
                                    Completed {step.date} by {step.by}
                                  </span>
                                )}
                              </div>
                            </div>

                            {!step.completed && (
                              <button
                                onClick={() => toggleClearanceStep(cl.id, stepNum)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-lg transition-transform active:scale-95 flex-shrink-0"
                              >
                                Mark Complete
                              </button>
                            )}

                            {step.completed && cl.status !== 'completed' && (
                              <button
                                onClick={() => toggleClearanceStep(cl.id, stepNum)}
                                className="text-slate-400 hover:text-red-500 font-mono text-[9px] px-1 transition-colors"
                              >
                                Undo
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Visual Progress bar and footer buttons */}
                    <div className="flex items-center gap-6 pt-3 flex-wrap">
                      <div className="flex-1 min-w-[200px] space-y-1 font-mono">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Completion Bar</span>
                        <div className="relative inline-flex items-center justify-center w-full">
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold block pt-1">
                          Overall Progress {doneCount}/{totalSteps} tasks
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => showAlert('Details overview populated successfully.', 'success')}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 px-4 rounded-xl transition-all"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => showAlert(`Clearance Certificate for ${cl.name} dispatched!`, 'success')}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm"
                        >
                          Generate Clearance Certificate
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Footer Row */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono block">Quick Actions</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => showAlert('Bulk update completed!', 'success')}
                className="bg-white hover:bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-center space-y-1 transition-all active:scale-95"
              >
                <CheckCircle className="w-4 h-4 mx-auto text-blue-600" />
                <span className="text-xs font-bold text-slate-700 block">Bulk Update</span>
              </button>
              <button
                onClick={() => showAlert('Checklist CSV exported successfully!', 'success')}
                className="bg-white hover:bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center space-y-1 transition-all active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 mx-auto text-blue-600" />
                <span className="text-xs font-bold text-slate-700 block">Export Checklist</span>
              </button>
              <button
                onClick={() => showAlert('Reminders fired to all incomplete stakeholders!', 'success')}
                className="bg-white hover:bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center space-y-1 transition-all active:scale-95"
              >
                <Send className="w-4 h-4 mx-auto text-blue-600" />
                <span className="text-xs font-bold text-slate-700 block">Send Reminder</span>
              </button>
              <button
                onClick={() => showAlert('Attrition statistical report compiled!', 'success')}
                className="bg-white hover:bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center space-y-1 transition-all active:scale-95"
              >
                <ClipboardList className="w-4 h-4 mx-auto text-blue-600" />
                <span className="text-xs font-bold text-slate-700 block">Generate Reports</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. RELATED FORMS VIEW */}
      {currentTab === 'forms' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Exit Interview Form</span>
                <span className="text-3xl font-bold text-slate-800">1</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Resignation Templates</span>
                <span className="text-3xl font-bold text-slate-800">2</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Satisfaction Surveys</span>
                <span className="text-3xl font-bold text-slate-800">1</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Letter Templates</span>
                <span className="text-3xl font-bold text-slate-800">2</span>
              </div>
              <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Form Management */}
          <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Form Management</h3>
              <p className="text-xs text-slate-400">Create and manage exit related forms, templates, and documents.</p>
            </div>

            <div className="space-y-6">
              {/* Form item 1 */}
              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">Exit Interview Form</h4>
                        <span className="bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                          Interview
                        </span>
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold font-mono px-1.5 py-0.2 rounded">
                          v2.1
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Comprehensive exit interview questionnaire</p>
                    </div>
                  </div>
                  <button
                    onClick={() => showAlert('Form template download initialized.', 'success')}
                    className="sm:ml-auto border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>

                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Form Fields</span>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    {[
                      'Employee Information',
                      'Reason for Leaving',
                      'Job Satisfaction Rating',
                      'Management Feedback',
                      'Work Environment',
                      'Career Development',
                      'Suggestions for Improvement',
                      'Would Recommend Company'
                    ].map(field => (
                      <span key={field} className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-600 font-semibold text-[10px]">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono text-xs pt-1">
                  <span>Updated: 2023-07-15 <span className="text-slate-200">|</span> Used 65 times</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showAlert('Editing is a mock task.', 'success')}
                      className="text-slate-500 hover:text-slate-700 font-bold hover:underline py-1 px-2.5 rounded hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => showAlert('Cannot delete system required questionnaire.', 'error')}
                      className="text-red-500 hover:text-red-700 font-bold hover:underline py-1 px-2.5 rounded hover:bg-red-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Form item 2 */}
              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileSignature className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">Resignation Letter Template</h4>
                        <span className="bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                          resignation
                        </span>
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold font-mono px-1.5 py-0.2 rounded">
                          v1.5
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Standard resignation letter format for employees</p>
                    </div>
                  </div>
                  <button
                    onClick={() => showAlert('Standard format letter template downloaded successfully.', 'success')}
                    className="sm:ml-auto border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 font-mono space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">Template Preview</span>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                    Dear [Manager Name],

                    I am writing to formally notify you of my resignation from my position as [Position] at [Company Name]. My last working day will be [Date], providing the required [Notice Period] notice.
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono text-xs pt-1">
                  <span>Updated: 2023-12-10 <span className="text-slate-200">|</span> Used 78 times</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showAlert('Mock edit action triggered.', 'success')}
                      className="text-slate-500 hover:text-slate-700 font-bold hover:underline py-1 px-2.5 rounded hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => showAlert('Deleted letter format draft.', 'success')}
                      className="text-red-500 hover:text-red-700 font-bold hover:underline py-1 px-2.5 rounded hover:bg-red-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Form item 3 */}
              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileSignature className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">Resignation Letter Template</h4>
                        <span className="bg-[#1e40af] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                          resignation
                        </span>
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold font-mono px-1.5 py-0.2 rounded">
                          v1.5
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Standard resignation letter format for employees</p>
                    </div>
                  </div>
                  <button
                    onClick={() => showAlert('Project hand-over letter template downloaded successfully.', 'success')}
                    className="sm:ml-auto border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 font-mono space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">Template Preview</span>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                    Dear [Manager Name],

                    I am writing to formally notify you of my resignation from my position as [Position] at [Company Name]. My last working day will be [Date], providing the required [Notice Period] notice.
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono text-xs pt-1">
                  <span>Updated: 2023-12-10 <span className="text-slate-200">|</span> Used 78 times</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showAlert('Mock edit action triggered.', 'success')}
                      className="text-slate-500 hover:text-slate-700 font-bold hover:underline py-1 px-2.5 rounded hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => showAlert('Deleted letter format draft.', 'success')}
                      className="text-red-500 hover:text-red-700 font-bold hover:underline py-1 px-2.5 rounded hover:bg-red-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. HIGH FIDELITY POPUPS / MODALS */}
      {showLogInterviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="text-blue-600 w-4 h-4" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Log Exit Feedback Form</h3>
              </div>
              <button
                onClick={() => setShowLogInterviewModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitLoggedInterview} className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Departing Employee Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jessica Parker"
                    value={newInterview.name}
                    onChange={e => setNewInterview({ ...newInterview, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Working Role</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend"
                    value={newInterview.role}
                    onChange={e => setNewInterview({ ...newInterview, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Department</label>
                  <select
                    value={newInterview.dept}
                    onChange={e => setNewInterview({ ...newInterview, dept: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium bg-white"
                  >
                    <option value="TECHNICAL DEPT.">TECHNICAL DEPT.</option>
                    <option value="MARKETING DEPT.">MARKETING DEPT.</option>
                    <option value="DESIGN DEPT.">DESIGN DEPT.</option>
                    <option value="HR DEPT.">HR DEPT.</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Interviewer</label>
                  <input
                    type="text"
                    placeholder="Jennifer Smith"
                    value={newInterview.interviewer}
                    onChange={e => setNewInterview({ ...newInterview, interviewer: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Departure Rating (1-5)</label>
                  <select
                    value={newInterview.rating}
                    onChange={e => setNewInterview({ ...newInterview, rating: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium bg-white"
                  >
                    <option value="5">5.0 - Excellent</option>
                    <option value="4">4.0 - Good</option>
                    <option value="3">3.0 - Satisfactory</option>
                    <option value="2">2.0 - Poor</option>
                    <option value="1">1.0 - Highly Dissatisfactory</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Would Recommend Company</label>
                <div className="flex gap-4 font-mono font-bold">
                  {['Yes', 'No'].map(val => (
                    <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="recommend"
                        value={val}
                        checked={newInterview.recommend === val}
                        onChange={() => setNewInterview({ ...newInterview, recommend: val })}
                        className="accent-blue-600 scale-105"
                      />
                      {val}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Feedback Summary / Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Reasons for leaving, concerns, suggested salary standardizations or mentorship guidelines..."
                  value={newInterview.remarks}
                  onChange={e => setNewInterview({ ...newInterview, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-50 font-semibold">
                <button
                  type="button"
                  onClick={() => setShowLogInterviewModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 py-2.5 px-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl transition-all shadow-sm"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
