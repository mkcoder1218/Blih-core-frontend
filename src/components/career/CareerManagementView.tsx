/**
 * CareerManagementView — thin shell
 * All tab content lives in ./tabs/* — one focused component per tab.
 */
import CareerOverviewTab  from './tabs/CareerOverviewTab';
import CareerCareerTab    from './tabs/CareerCareerTab';
import CareerTrainingTab  from './tabs/CareerTrainingTab';
import CareerCultureTab   from './tabs/CareerCultureTab';
import DevelopmentTab     from './tabs/DevelopmentTab';

export type TalentTab = 'overview' | 'career' | 'training' | 'culture' | 'development';

interface CareerManagementViewProps {
  currentTab: TalentTab;
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

export default function CareerManagementView({
  currentTab,
  onDraftAiSuggestion,
  showAlert,
}: CareerManagementViewProps) {
  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
      {currentTab === 'overview'     && <CareerOverviewTab  onDraftAiSuggestion={onDraftAiSuggestion} showAlert={showAlert} />}
      {currentTab === 'career'       && <CareerCareerTab    showAlert={showAlert} />}
      {currentTab === 'training'     && <CareerTrainingTab  showAlert={showAlert} />}
      {currentTab === 'culture'      && <CareerCultureTab   showAlert={showAlert} />}
      {currentTab === 'development'  && <DevelopmentTab     showAlert={showAlert} />}
    </div>
  );
}
