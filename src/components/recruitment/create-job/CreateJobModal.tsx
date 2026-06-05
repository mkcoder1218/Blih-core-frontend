import { useEffect, useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import RequestFormStep from './RequestFormStep';
import JobDetailsStep from './JobDetailsStep';
import ApplicationFormStep from './ApplicationFormStep';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
  isTemplateMode?: boolean;
  initialData?: any;
}

export default function CreateJobModal({ 
  isOpen, 
  onClose, 
  onCreate, 
  isTemplateMode = false,
  initialData 
}: CreateJobModalProps) {
  const [step, setStep] = useState(1);
  const emptyForm = useMemo(
    () => ({
    // Step 1: Request Form
    jobTitle: '',
    department: '',
    position: '',
    type: 'New Role',
    replaceFor: 'Not applicable',
    businessJustification: '',
    employmentType: 'Full-time',
    workMode: 'On-site',
    urgency: 'Medium',
    priority: 'Medium',
    neededByDate: '',

    // Step 2: Job Details
    openings: 1,
    city: '',
    country: '',
    locationType: 'On-site',
    contractType: 'Permanent',
    experienceLevel: 'Mid Level',
    hiringManager: '',
    deadline: '',
    description: '',
    summary: '',
    responsibilities: '',
    requiredSkills: '',
    preferredSkills: '',
    tools: '',
    benefits: '',
    salaryType: 'Not Specified',

    // Step 3: Application Form
    applicantFields: {
      firstName: { included: true, required: true },
      lastName: { included: true, required: true },
      email: { included: true, required: true },
      phone: { included: true, required: true },
      resumeUrl: { included: false, required: false },
      currentCompany: { included: false, required: false },
      yearsExperience: { included: false, required: false },
      linkedinUrl: { included: false, required: false },
      portfolioUrl: { included: false, required: false },
      githubUrl: { included: false, required: false },
      expectedSalary: { included: false, required: false },
      coverLetter: { included: false, required: false },
    },
    customFields: []
  }),
    []
  );

  const [formData, setFormData] = useState<any>(initialData || emptyForm);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setFormData(initialData || emptyForm);
  }, [isOpen, initialData, emptyForm]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onCreate(formData);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const steps = [
    { title: 'Request Form', subtitle: 'Internal hiring request details' },
    { title: 'Job Details', subtitle: 'Public job board information' },
    { title: 'Application Form', subtitle: 'Candidate application questions' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="bg-slate-50 w-[calc(100vw-1rem)] max-w-[72rem] sm:max-w-[72rem] h-[calc(100dvh-1rem)] sm:h-auto sm:max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20 p-0 gap-0"
      >
        {/* Header */}
        <div className="bg-white px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Step {step} of 3</span>
            <DialogTitle className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {isTemplateMode ? 'Create Job Template' : 'Create Hiring Request'}
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400 font-medium">{steps[step - 1].subtitle}</DialogDescription>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="bg-white px-4 sm:px-8 py-4 border-b border-slate-100 overflow-x-auto">
            <div className="flex items-center gap-3 sm:gap-4 w-max min-w-full sm:w-full sm:max-w-4xl sm:mx-auto">
                {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3 sm:flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            step > i + 1 ? 'bg-blue-600 text-white' : 
                            step === i + 1 ? 'bg-blue-600 text-white ring-4 ring-blue-50' : 
                            'bg-slate-100 text-slate-400'
                        }`}>
                            {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                        </div>
                        <div className="hidden min-[430px]:flex flex-col">
                            <span className={`text-[11px] font-bold ${step === i + 1 ? 'text-slate-900' : 'text-slate-400'}`}>{s.title}</span>
                            <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">{s.subtitle}</span>
                        </div>
                        {i < steps.length - 1 && <div className="w-10 sm:flex-1 h-[2px] bg-slate-100 mx-2 sm:mx-4" />}
                    </div>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
            {step === 1 && <RequestFormStep data={formData} updateData={(update) => setFormData({...formData, ...update})} />}
            {step === 2 && <JobDetailsStep data={formData} updateData={(update) => setFormData({...formData, ...update})} />}
            {step === 3 && <ApplicationFormStep data={formData} updateData={(update) => setFormData({...formData, ...update})} />}
        </div>

        {/* Footer */}
        <div className="bg-white px-4 sm:px-8 py-4 sm:py-5 border-t border-slate-100 flex items-center justify-end gap-3 font-sans">
            <button 
                onClick={step === 1 ? onClose : handleBack}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    step === 1 ? 'text-slate-300 hover:text-slate-500 hover:bg-slate-50' : 'text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
            >
                {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button 
                onClick={handleNext}
                className="min-w-0 px-4 sm:px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all active:scale-98"
            >
                {step === 3 ? (isTemplateMode ? 'Save Template' : 'Request Approval') : step === 1 ? 'Continue to Job Details' : 'Continue to Application Form'}
            </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
