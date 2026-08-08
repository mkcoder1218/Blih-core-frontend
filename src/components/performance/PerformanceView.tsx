import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import PerformanceOverview from './PerformanceOverview';
import PerformanceReviewTab from './PerformanceReviewTab';
import OkrsTab from './OkrsTab';
import KpisTab from './KpisTab';
import DisciplineTab from './DisciplineTab';
import EvaluationFormTab from './EvaluationFormTab';

interface PerformanceViewProps {
  currentTab: string;
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function PerformanceView({ currentTab, onDraftAiSuggestion, showAlert }: PerformanceViewProps) {
  // Map panel states
  const renderActiveTab = () => {
    switch (currentTab) {
      case 'performance_review':
        return <PerformanceReviewTab onDraftAiSuggestion={onDraftAiSuggestion} showAlert={showAlert} />;
      case 'okrs':
        return <OkrsTab onDraftAiSuggestion={onDraftAiSuggestion} showAlert={showAlert} />;
      case 'kpis':
        return <KpisTab onDraftAiSuggestion={onDraftAiSuggestion} showAlert={showAlert} />;
      case 'discipline':
        return <DisciplineTab onDraftAiSuggestion={onDraftAiSuggestion} showAlert={showAlert} />;
      case 'evaluation_form':
        return <EvaluationFormTab showAlert={showAlert} />;
      default:
        return <PerformanceReviewTab onDraftAiSuggestion={onDraftAiSuggestion} showAlert={showAlert} />;
    }
  };

  return (
    <div id="performance-main-container" className="w-full h-full max-w-7xl mx-auto pb-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full"
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
