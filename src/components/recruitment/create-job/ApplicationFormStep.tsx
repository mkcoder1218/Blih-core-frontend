import { PlusCircle } from 'lucide-react';

interface ApplicationFormStepProps {
  data: any;
  updateData: (update: any) => void;
}

export default function ApplicationFormStep({ data, updateData }: ApplicationFormStepProps) {
  const fields = [
    { id: 'firstName', label: 'First Name' },
    { id: 'lastName', label: 'Last Name' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'resumeUrl', label: 'Resume Url' },
    { id: 'currentCompany', label: 'Current Company' },
    { id: 'yearsExperience', label: 'Years Of Experience' },
    { id: 'linkedinUrl', label: 'Linkedin Url' },
    { id: 'portfolioUrl', label: 'Portfolio Url' },
    { id: 'githubUrl', label: 'Github Url' },
    { id: 'expectedSalary', label: 'Expected Salary' },
    { id: 'coverLetter', label: 'Cover Letter' },
  ];

  const handleToggleIncluded = (fieldId: string) => {
    const field = data.applicantFields[fieldId];
    updateData({
      applicantFields: {
        ...data.applicantFields,
        [fieldId]: { ...field, included: !field.included }
      }
    });
  };

  const handleToggleRequired = (fieldId: string) => {
    const field = data.applicantFields[fieldId];
    updateData({
      applicantFields: {
        ...data.applicantFields,
        [fieldId]: { ...field, required: !field.required }
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
      {/* Left Column: Form Setup */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Applicant Fields</h3>
            <p className="text-[11px] text-slate-400 font-medium">Turn standard applicant fields on or off.</p>
          </div>

          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 group hover:border-blue-100 transition-all">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-800">{field.label}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold text-slate-400 rounded-md uppercase">Short Text</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleToggleIncluded(field.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            data.applicantFields[field.id].included 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {data.applicantFields[field.id].included ? 'Included' : 'Add Field'}
                    </button>
                    <button 
                        onClick={() => handleToggleRequired(field.id)}
                        disabled={!data.applicantFields[field.id].included}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            data.applicantFields[field.id].required 
                            ? 'bg-blue-400 text-white' 
                            : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600'
                        } disabled:opacity-30`}
                    >
                        {data.applicantFields[field.id].required ? 'Required' : 'Optional'}
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CUSTOM FIELDS */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Custom Fields</h3>
            <p className="text-[11px] text-slate-400 font-medium">Add custom questions for this role.</p>
          </div>

          <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/30">
            <p className="text-[11px] font-bold text-slate-400 mb-6">No custom fields yet.</p>
            <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer">
                <PlusCircle className="w-4 h-4 text-slate-400" />
                <span>Add Custom Field</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="lg:col-span-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs sticky top-0">
          <div className="mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preview</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Application Preview</h3>
            <p className="text-[11px] text-slate-400 font-medium">This is how the form will be structured for applicants.</p>
          </div>

          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-6">
             <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">Apply for this role</h4>
                <p className="text-[10px] text-slate-400 font-medium italic">Review the applicant-facing form fields.</p>
             </div>

             <div className="space-y-4">
                {fields.filter(f => data.applicantFields[f.id].included).slice(0, 4).map((field) => (
                    <div key={field.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">{field.label}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[7px] font-extrabold text-slate-300 uppercase tracking-widest bg-white border border-slate-100 px-1 rounded">Short Text</span>
                                {data.applicantFields[field.id].required && (
                                    <span className="text-[7px] font-extrabold text-blue-400 uppercase tracking-widest bg-blue-50 px-1 rounded">Required</span>
                                )}
                            </div>
                        </div>
                        <div className="w-full h-10 bg-white border border-slate-100 rounded-lg shadow-sm" />
                    </div>
                ))}
                {fields.filter(f => data.applicantFields[f.id].included).length > 4 && (
                    <div className="text-center pt-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">+ {fields.filter(f => data.applicantFields[f.id].included).length - 4} more fields</p>
                    </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
