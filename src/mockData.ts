/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JobRequest, RecentActivity, PendingAction, EmployeeProfile } from './types';

export const mockRecentActivities: RecentActivity[] = [
  {
    id: 'act-1',
    module: 'recruitment',
    title: 'Recruitment',
    description: 'New job posted: Senior Software Engineer',
    timeLabel: '2 hours ago',
    status: 'active'
  },
  {
    id: 'act-2',
    module: 'onboarding',
    title: 'Onboarding',
    description: '5 new employees onboarded',
    timeLabel: '4 hours ago',
    status: 'completed'
  },
  {
    id: 'act-3',
    module: 'performance',
    title: 'Performance',
    description: 'Q1 reviews completed',
    timeLabel: '1 day ago',
    status: 'completed'
  },
  {
    id: 'act-4',
    module: 'attendance',
    title: 'Leave',
    description: '15 leave requests pending approval',
    timeLabel: '3 hours ago',
    status: 'pending'
  },
  {
    id: 'act-5',
    module: 'talent',
    title: 'Training',
    description: 'Leadership workshop scheduled',
    timeLabel: '5 hours ago',
    status: 'scheduled'
  }
];

export const mockPendingActions: PendingAction[] = [
  {
    id: 'pa-1',
    module: 'recruitment',
    title: 'Recruitment',
    subtitle: 'Job requisitions awaiting approval',
    count: 8
  },
  {
    id: 'pa-2',
    module: 'onboarding',
    title: 'Onboarding',
    subtitle: 'New hires to be assigned mentors',
    count: 5
  },
  {
    id: 'pa-3',
    module: 'attendance',
    title: 'Leave',
    subtitle: 'Leave requests pending approval',
    count: 15
  },
  {
    id: 'pa-4',
    module: 'performance',
    title: 'Performance',
    subtitle: 'Probation reviews due this week',
    count: 12
  },
  {
    id: 'pa-5',
    module: 'exit',
    title: 'Exit',
    subtitle: 'Exit interviews to be scheduled',
    count: 3
  }
];

export const mockJobRequests: JobRequest[] = [
  // Pending approvals
  {
    id: 'req-1',
    title: 'Senior Software Engineer',
    department: 'TECHNICAL DEPT.',
    type: 'Full-time',
    positions: 3,
    requestedDate: 'Feb 7, 2025',
    priority: 'High',
    status: 'pending'
  },
  {
    id: 'req-2',
    title: 'Product Manager',
    department: 'TECHNICAL DEPT.',
    type: 'Full-time',
    positions: 1,
    requestedDate: 'Feb 7, 2025',
    priority: 'Medium',
    status: 'pending'
  },
  {
    id: 'req-3',
    title: 'UI/UX Designer',
    department: 'CREATIVE DEPT.',
    type: 'Remote',
    positions: 2,
    requestedDate: 'Feb 7, 2025',
    priority: 'Low',
    status: 'pending'
  },
  {
    id: 'req-4',
    title: 'Data Analyst',
    department: 'DIGITAL MARKETING DEPT.',
    type: 'Remote',
    positions: 2,
    requestedDate: 'Feb 7, 2025',
    priority: 'Low',
    status: 'pending'
  },
  // Approved By You
  {
    id: 'req-5',
    title: 'Marketing Manager',
    department: 'TECHNICAL DEPT.',
    type: 'Full-time',
    positions: 3,
    requestedDate: 'Feb 7, 2025',
    priority: 'Medium',
    status: 'approved'
  },
  {
    id: 'req-6',
    title: 'Marketing Manager',
    department: 'TECHNICAL DEPT.',
    type: 'Full-time',
    positions: 1,
    requestedDate: 'Feb 7, 2025',
    priority: 'High',
    status: 'approved'
  },
  // Declined (image 3)
  {
    id: 'req-7',
    title: 'Marketing Manager',
    department: 'TECHNICAL DEPT.',
    type: 'Full-time',
    positions: 3,
    requestedDate: 'Feb 7, 2025',
    priority: 'Medium',
    status: 'declined'
  },
  {
    id: 'req-8',
    title: 'Marketing Manager',
    department: 'TECHNICAL DEPT.',
    type: 'Full-time',
    positions: 1,
    requestedDate: 'Feb 7, 2025',
    priority: 'Medium',
    status: 'declined'
  },
  {
    id: 'req-9',
    title: 'Marketing Manager',
    department: 'TECHNICAL DEPT.',
    type: 'Full-time',
    positions: 3,
    requestedDate: 'Feb 7, 2025',
    priority: 'Medium',
    status: 'declined'
  },
  {
    id: 'req-10',
    title: 'Marketing Manager',
    department: 'TECHNICAL DEPT.',
    type: 'Full-time',
    positions: 1,
    requestedDate: 'Feb 7, 2025',
    priority: 'Medium',
    status: 'declined'
  }
];

// Details of a Job Ready to Post (Image 4)
export const activeReadyToPostJob: JobRequest = {
  id: 'rtp-1',
  title: 'Marketing Manager',
  department: 'DIGITAL MARKETING DEPT.',
  type: 'Full-time',
  positions: 1,
  requestedDate: 'Dec 15, 2024',
  dueDate: 'Dec 15, 2024',
  expectedDate: 'Dec 15, 2024',
  priority: 'High',
  status: 'approved',
  requestedBy: {
    name: 'Jessica Parker',
    role: 'Full Stack Developer',
    dept: 'TECHNICAL DEPT.',
    avatar: 'JP'
  },
  overview: "We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform.",
  requirements: [
    '7+ years in marketing',
    'Experience with digital marketing',
    'Strong analytical skills',
    'Team leadership experience'
  ],
  qualifications: [
    '7+ years in marketing',
    'Experience with digital marketing',
    'Strong analytical skills',
    'Team leadership experience'
  ],
  importance: "We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform."
};

// Additional analytical dashboard entries
export const jobApplicationFrequencyData = [
  { month: 'Jan', count: 151 },
  { month: 'Feb', count: 153 },
  { month: 'Mar', count: 158 },
  { month: 'Apr', count: 147 },
  { month: 'May', count: 156 },
  { month: 'Jun', count: 154 },
  { month: 'Jul', count: 160 },
  { month: 'Aug', count: 151 },
  { month: 'Sep', count: 155 },
  { month: 'Oct', count: 157 },
  { month: 'Nov', count: 154 },
  { month: 'Dec', count: 149 }
];

export const marketingManagerPostAnalytics = [
  { month: 'Jan', count: 108 },
  { month: 'Feb', count: 119 },
  { month: 'Mar', count: 135 },
  { month: 'Apr', count: 82 },
  { month: 'May', count: 121 },
  { month: 'Jun', count: 118 },
  { month: 'Jul', count: 142 },
  { month: 'Aug', count: 98 },
  { month: 'Sep', count: 120 },
  { month: 'Oct', count: 125 },
  { month: 'Nov', count: 112 },
  { month: 'Dec', count: 89 }
];

export const fullStackPostAnalytics = [
  { month: 'Jan', count: 85 },
  { month: 'Feb', count: 92 },
  { month: 'Mar', count: 110 },
  { month: 'Apr', count: 124 },
  { month: 'May', count: 140 },
  { month: 'Jun', count: 135 },
  { month: 'Jul', count: 155 },
  { month: 'Aug', count: 140 },
  { month: 'Sep', count: 148 },
  { month: 'Oct', count: 152 },
  { month: 'Nov', count: 138 },
  { month: 'Dec', count: 143 }
];

export const frequentlyPostedJobs = [
  { id: 'fp-1', title: 'Full-stack Developer', count: 156 },
  { id: 'fp-2', title: 'Marketing Manager', count: 144 },
  { id: 'fp-3', title: 'Graphic Designer', count: 12 },
  { id: 'fp-4', title: 'Finance Executive', count: 5 }
];

// Employee profiles for standard screens
export const mockEmployees: EmployeeProfile[] = [
  {
    id: 'emp-1',
    name: 'Aytenew Yihunie',
    role: 'Product Designer',
    email: 'aytenew@blihmarketing.com',
    dept: 'CREATIVE DEPT.',
    status: 'active',
    salary: '18500',
    experience: '5-10 yr',
    gender: 'Male',
    performanceRating: 4.8,
    tags: ['UI', 'UX', 'Figma']
  },
  {
    id: 'emp-2',
    name: 'Jessica Parker',
    role: 'Full Stack Developer',
    email: 'jessica@blihmarketing.com',
    dept: 'TECHNICAL DEPT.',
    status: 'active',
    salary: '22000',
    experience: '10+ yr',
    gender: 'Female',
    performanceRating: 4.9,
    tags: ['React', 'Node.js', 'System Architecture']
  },
  {
    id: 'emp-3',
    name: 'Mathew Evans',
    role: 'HR Executive',
    email: 'mathew@blihmarketing.com',
    dept: 'HR DEPT.',
    status: 'active',
    salary: '11200',
    experience: '3-5 yr',
    gender: 'Male',
    performanceRating: 4.5,
    tags: ['Recruiting', 'Compensation', 'Compliance']
  },
  {
    id: 'emp-4',
    name: 'Eleanor Vance',
    role: 'Finance Manager',
    email: 'eleanor@blihmarketing.com',
    dept: 'FINANCE DEPT.',
    status: 'active',
    salary: '19000',
    experience: '5-10 yr',
    gender: 'Female',
    performanceRating: 4.7,
    tags: ['Taxation', 'Modeling', 'Audit']
  },
  {
    id: 'emp-5',
    name: 'Marcus Brody',
    role: 'Digital Marketer',
    email: 'marcus@blihmarketing.com',
    dept: 'DIGITAL MARKETING DEPT.',
    status: 'active',
    salary: '14500',
    experience: '3-5 yr',
    gender: 'Male',
    performanceRating: 4.2,
    tags: ['Google Ads', 'SEO', 'PPC']
  },
  {
    id: 'emp-6',
    name: 'Sophia Ross',
    role: 'Junior Content Writer',
    email: 'sophia@blihmarketing.com',
    dept: 'DIGITAL MARKETING DEPT.',
    status: 'onboarding',
    salary: '8500',
    experience: '0-2 yr',
    gender: 'Female',
    performanceRating: 4.0,
    tags: ['Copywriting', 'SEO']
  }
];

export const mockLeaveRequests = [
  { id: 'lv-1', name: 'Aytenew Y.', type: 'Annual Leave', days: 5, status: 'Pending Approval', date: 'Feb 12, 2025' },
  { id: 'lv-2', name: 'Marcus Brody', type: 'Sick Leave', days: 2, status: 'Approved', date: 'Feb 10, 2025' },
  { id: 'lv-3', name: 'Eleanor Vance', type: 'Maternity Leave', days: 45, status: 'Pending Approval', date: 'Feb 18, 2025' },
  { id: 'lv-4', name: 'Jessica Parker', type: 'Casual Leave', days: 1, status: 'Approved', date: 'Feb 05, 2025' }
];

export const mockAttendanceRecords = [
  { id: 'att-1', name: 'Aytenew Yihunie', date: 'May 22, 2026', checkIn: '08:58 AM', checkOut: '05:30 PM', status: 'On-time' },
  { id: 'att-2', name: 'Jessica Parker', date: 'May 22, 2026', checkIn: '09:12 AM', checkOut: '06:00 PM', status: 'Late' },
  { id: 'att-3', name: 'Mathew Evans', date: 'May 22, 2026', checkIn: '08:45 AM', checkOut: '05:00 PM', status: 'On-time' },
  { id: 'att-4', name: 'Eleanor Vance', date: 'May 22, 2026', checkIn: '09:02 AM', checkOut: '05:45 PM', status: 'On-time' },
  { id: 'att-5', name: 'Marcus Brody', date: 'May 22, 2026', checkIn: '09:40 AM', checkOut: '06:15 PM', status: 'Late' },
  { id: 'att-6', name: 'Sophia Ross', date: 'May 22, 2026', checkIn: '08:55 AM', checkOut: '05:30 PM', status: 'On-time' }
];

export const mockPayrollDetails = [
  { id: 'pay-1', name: 'Jessica Parker', baseSalary: 22000, allowances: 2000, deductions: 1200, netPay: 22800, paymentStatus: 'Paid' },
  { id: 'pay-2', name: 'Eleanor Vance', baseSalary: 19000, allowances: 1500, deductions: 900, netPay: 19600, paymentStatus: 'Paid' },
  { id: 'pay-3', name: 'Aytenew Yihunie', baseSalary: 18500, allowances: 1200, deductions: 1000, netPay: 18700, paymentStatus: 'Paid' },
  { id: 'pay-4', name: 'Marcus Brody', baseSalary: 14500, allowances: 1000, deductions: 700, netPay: 14800, paymentStatus: 'Paid' },
  { id: 'pay-5', name: 'Mathew Evans', baseSalary: 11200, allowances: 800, deductions: 600, netPay: 11400, paymentStatus: 'Processed' },
  { id: 'pay-6', name: 'Sophia Ross', baseSalary: 8500, allowances: 500, deductions: 300, netPay: 8700, paymentStatus: 'Pending' }
];
