/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MainModule =
  | 'recruitment'
  | 'onboarding'
  | 'profiles'
  | 'attendance'
  | 'performance'
  | 'talent'
  | 'exit'
  | 'finance';

export type RecruitmentTab =
  | 'overview'
  | 'requests'
  | 'ready_to_post'
  | 'active_posting'
  | 'ongoing_recruitment'
  | 'offers'
  | 'closed_posts'
  | 'applicant_forms';

export interface JobRequest {
  id: string;
  title: string;
  department: string;
  type: 'Full-time' | 'Part-time' | 'Remote' | 'Contract';
  positions: number;
  requestedDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'approved' | 'declined' | 'draft';
  dueDate?: string;
  expectedDate?: string;
  requestedBy?: {
    name: string;
    role: string;
    avatar?: string;
    dept: string;
  };
  overview?: string;
  requirements?: string[];
  qualifications?: string[];
  importance?: string;
}

export interface RecentActivity {
  id: string;
  module: MainModule;
  title: string;
  description: string;
  timeLabel: string;
  status: 'active' | 'completed' | 'pending' | 'scheduled';
}

export interface PendingAction {
  id: string;
  module: MainModule;
  title: string;
  subtitle: string;
  count: number;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  role: string;
  email: string;
  dept: string;
  status: 'Active' | 'On Leave' | 'Onboarding' | 'Suspended';
  salary: string;
  experience: string;
  gender: 'Male' | 'Female' | 'Other';
  performanceRating: number;
  tags: string[];
}
