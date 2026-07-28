/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { EmploymentStatus } from "./constants/employee";

export type MainModule =
  | 'recruitment'
  | 'onboarding'
  | 'profiles'
  | 'attendance'
  | 'performance'
  | 'talent'
  | 'exit'
  | 'finance'
  | 'projects'
  | 'subscription-settings'
  | 'businesses'
  | 'permissions'
  | 'subscription'
  | 'brain';

export type RecruitmentTab =
  | 'overview'
  | 'requests'
  | 'ready_to_post'
  | 'active_posting'
  | 'ongoing_recruitment'
  | 'my_interviews'
  | 'offers'
  | 'offer_templates'
  | 'closed_posts'
  | 'applicant_forms';

export type BusinessesTab = 'overview' | 'plans' | 'sector_focus' | 'smtp_providers' | 'integrations' | 'security' | 'audit_logs' | 'notifications';
export type ProjectsTab = 'overview' | 'all' | 'mine' | 'my-tasks' | 'board';

export interface JobRequest {
  id: string;
  title: string;
  department: string;
  type: 'Full-time' | 'Part-time' | 'Remote' | 'Contract';
  positions: number;
  requestedDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'approved' | 'declined' | 'draft';
  postingStatus?: 'draft' | 'open' | 'paused' | 'closed' | 'active' | 'published' | string;
  views?: number;
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
  isPosted?: boolean;
  applicationFields?: any;
  approvals?: {
    role: string;
    userId: string;
    userName?: string;
    stage?: string;
    approvedAt: string;
  }[];
  approvalStage?: 'hr_review' | 'final_approval' | 'approved' | 'rejected' | string;
  approvalStageLabel?: string;
  currentReviewer?: string;
  rejectionReason?: string | null;
  rejectedByUserId?: string | null;
  rejectedAt?: string | null;
  approvalHistory?: {
    stage: string;
    action: 'submitted' | 'approved' | 'rejected' | string;
    role?: string;
    userId?: string;
    userName?: string;
    at?: string;
    reason?: string | null;
  }[];
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
  status: EmploymentStatus;
  salary: string;
  experience: string;
  gender: 'Male' | 'Female' | 'Other';
  performanceRating: number;
  tags: string[];
}
