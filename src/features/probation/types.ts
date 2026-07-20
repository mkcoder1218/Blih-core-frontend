export interface ProbationWeights {
  punctualityWeight: number;
  attendanceWeight: number;
  performanceWeight: number;
}

export interface ProbationReview {
  id: string;
  periodStart: string;
  periodEnd: string;
  score: number;
  status: string;
  reviewerName?: string | null;
  reviewData: Record<string, unknown>;
}

export interface ProbationDashboardRow {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string | null;
  department?: { id: string; name: string } | null;
  position?: { id: string; title: string } | null;
  probationStartDate: string;
  probationEndDate: string;
  daysRemaining: number;
  countdownLabel: string;
  punctualityScore: number;
  attendanceScore: number;
  performanceScore: number;
  finalScore: number;
  status: string;
  probationCompletedAt?: string | null;
  completionEmailSentAt?: string | null;
  weights: ProbationWeights;
  attendanceBreakdown: {
    scheduledDays: number;
    expectedMinutes: number;
    workedMinutes: number;
    lateArrivals: number;
    absences: number;
    missingCheckouts: number;
    penaltyDays: number;
  };
  reviews: ProbationReview[];
}

export interface ProbationSummary {
  activeProbation: number;
  endingWithin7Days: number;
  completed: number;
  pendingHrAction: number;
}

export interface ProbationDashboardResponse {
  summary: ProbationSummary;
  weights: ProbationWeights;
  rows: ProbationDashboardRow[];
}

export interface ProbationFilters {
  search: string;
  departmentId: string;
  status: string;
  endFrom: string;
  endTo: string;
}

