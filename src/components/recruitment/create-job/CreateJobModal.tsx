import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import RequestFormStep from './RequestFormStep';
import JobDetailsStep from './JobDetailsStep';
import ApplicationFormStep from './ApplicationFormStep';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void | Promise<void>;
  isTemplateMode?: boolean;
  initialData?: any;
}

export default function CreateJobModal({
  isOpen,
  onClose,
  onCreate,
  isTemplateMode = false,
  initialData,
}: CreateJobModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emptyForm = useMemo(
    () => ({
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
      customFields: [],
    }),
    [],
  );

  const [formData, setFormData] = useState<any>(initialData || emptyForm);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setIsSubmitting(false);
    setFormData({
      ...emptyForm,
      ...(initialData || {}),
      applicantFields: {
        ...emptyForm.applicantFields,
        ...(initialData?.applicantFields || {}),
      },
      customFields: Array.isArray(initialData?.customFields) ? initialData.customFields : [],
    });
  }, [isOpen, initialData, emptyForm]);

  const handleNext = async () => {
    if (isSubmitting) return;

    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(formData);
    } catch {
      // The caller owns the user-facing error message. Keep the modal open so
      // the user can correct the request and submit again.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isSubmitting) return;
    if (step > 1) setStep((current) => current - 1);
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const steps = [
    { title: 'Request Form', subtitle: 'Internal hiring request details' },
    { title: 'Job Details', subtitle: 'Public job board information' },
    { title: 'Application Form', subtitle: 'Candidate application questions' },
  ];

  const finalButtonLabel = isTemplateMode ? 'Save Template' : 'Request Approval';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="bg-slate-50 w-[calc(100vw-1rem)] max-w-[72rem] sm:max-w-[72rem] h-[calc(100dvh-1rem)] sm:h-auto sm:max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20 p-0 gap-0"
      >
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
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white px-4 sm:px-8 py-4 border-b border-slate-100 overflow-x-auto">
          <div className="flex items-center gap-3 sm:gap-4 w-max min-w-full sm:w-full sm:max-w-4xl sm:mx-auto">
            {steps.map((currentStep, index) => (
              <div key={currentStep.title} className="flex items-center gap-2 sm:gap-3 sm:flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > index + 1
                    ? 'bg-blue-600 text-white'
                    : step === index + 1
                      ? 'bg-blue-600 text-white ring-4 ring-blue-50'
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <div className="hidden min-[430px]:flex flex-col">
                  <span className={`text-[11px] font-bold ${step === index + 1 ? 'text-slate-900' : 'text-slate-400'}`}>{currentStep.title}</span>
                  <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">{currentStep.subtitle}</span>
                </div>
                {index < steps.length - 1 && <div className="w-10 sm:flex-1 h-[2px] bg-slate-100 mx-2 sm:mx-4" />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {step === 1 && <RequestFormStep data={formData} updateData={(update) => setFormData((current: any) => ({ ...current, ...update }))} />}
          {step === 2 && <JobDetailsStep data={formData} updateData={(update) => setFormData((current: any) => ({ ...current, ...update }))} />}
          {step === 3 && <ApplicationFormStep data={formData} updateData={(update) => setFormData((current: any) => ({ ...current, ...update }))} />}
        </div>

        <div className="bg-white px-4 sm:px-8 py-4 sm:py-5 border-t border-slate-100 flex items-center justify-end gap-3 font-sans">
          <button
            type="button"
            onClick={step === 1 ? handleClose : handleBack}
            disabled={isSubmitting}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              step === 1
                ? 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
                : 'text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="min-w-0 px-4 sm:px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isTemplateMode ? 'Saving Template...' : 'Submitting Request...'}
              </span>
            ) : step === 3 ? (
              finalButtonLabel
            ) : step === 1 ? (
              'Continue to Job Details'
            ) : (
              'Continue to Application Form'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
