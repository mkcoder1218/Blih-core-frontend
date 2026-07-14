import JobRecruitmentWorkspace from './JobRecruitmentWorkspace';

interface Props {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

export default function RecruitmentOngoingRecruitment({ showAlert }: Props) {
  return <JobRecruitmentWorkspace initialTab="applicants" showAlert={showAlert} />;
}
