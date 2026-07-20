import { ProbationDashboard } from '../../../features/probation';

interface OnboardingProbationTabProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function OnboardingProbationTab(_props: OnboardingProbationTabProps) {
  return <ProbationDashboard />;
}
