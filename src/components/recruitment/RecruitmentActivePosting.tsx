import JobRecruitmentWorkspace from './JobRecruitmentWorkspace';

interface Props {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function RecruitmentActivePosting({ showAlert }: Props) {
  return <JobRecruitmentWorkspace initialTab="overview" showAlert={showAlert} />;
}
