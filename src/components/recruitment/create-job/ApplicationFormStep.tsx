import { PlusCircle, Trash2 } from 'lucide-react';

interface ApplicationFormStepProps {
  data: any;
  updateData: (update: any) => void;
}

type CustomFieldType = 'shortText' | 'longText' | 'number' | 'date' | 'select' | 'yesNo';

type CustomField = {
  id: string;
  name: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
};

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  shortText: 'Short Text',
  longText: 'Long Text',
  number: 'Number',
  date: 'Date',
  select: 'Dropdown',
  yesNo: 'Yes / No',
};

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

  const applicantFields = data.applicantFields || {};
  const customFields: CustomField[] = Array.isArray(data.customFields) ? data.customFields : [];

  const getFieldConfig = (fieldId: string) => applicantFields[fieldId] || { included: false, required: false };

  const handleToggleIncluded = (fieldId: string) => {
    const field = getFieldConfig(fieldId);
    const included = !field.included;
    updateData({
      applicantFields: {
        ...applicantFields,
        [fieldId]: {
          ...field,
          included,
          required: included ? Boolean(field.required) : false,
        },
      },
    });
  };

  const handleToggleRequired = (fieldId: string) => {
    const field = getFieldConfig(fieldId);
    if (!field.included) return;
    updateData({
      applicantFields: {
        ...applicantFields,
        [fieldId]: { ...field, required: !field.required },
      },
    });
  };

  const addCustomField = () => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    updateData({
      customFields: [
        ...customFields,
        {
          id,
          name: id,
          label: '',
          type: 'shortText',
          required: false,
          placeholder: '',
          options: [],
        } satisfies CustomField,
      ],
    });
  };

  const updateCustomField = (index: number, update: Partial<CustomField>) => {
    updateData({
      customFields: customFields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...update } : field,
      ),
    });
  };

  const removeCustomField = (index: number) => {
    updateData({
      customFields: customFields.filter((_, fieldIndex) => fieldIndex !== index),
    });
  };

  const includedStandardFields = fields.filter((field) => getFieldConfig(field.id).included);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Applicant Fields</h3>
            <p className="text-[11px] text-slate-400 font-medium">Turn standard applicant fields on or off.</p>
          </div>

          <div className="space-y-3">
            {fields.map((field) => {
              const config = getFieldConfig(field.id);
              return (
                <div key={field.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 group hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-800">{field.label}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold text-slate-400 rounded-md uppercase">Short Text</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleIncluded(field.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        config.included
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {config.included ? 'Included' : 'Add Field'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleRequired(field.id)}
                      disabled={!config.included}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        config.required
                          ? 'bg-blue-400 text-white'
                          : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600'
                      } disabled:opacity-30`}
                    >
                      {config.required ? 'Required' : 'Optional'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom</span>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Custom Fields</h3>
              <p className="text-[11px] text-slate-400 font-medium">Add custom questions for this role.</p>
            </div>
            {customFields.length > 0 && (
              <button
                type="button"
                onClick={addCustomField}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
              >
                <PlusCircle className="h-4 w-4" />
                Add Field
              </button>
            )}
          </div>

          {customFields.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/30">
              <p className="text-[11px] font-bold text-slate-400 mb-6">No custom fields yet.</p>
              <button
                type="button"
                onClick={addCustomField}
                className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-slate-400" />
                <span>Add Custom Field</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div key={field.id || index} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Field Label</label>
                      <input
                        type="text"
                        value={field.label || ''}
                        onChange={(event) => updateCustomField(index, { label: event.currentTarget.value })}
                        placeholder={`Custom question ${index + 1}`}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Field Type</label>
                      <select
                        value={field.type || 'shortText'}
                        onChange={(event) => updateCustomField(index, { type: event.currentTarget.value as CustomFieldType })}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400"
                      >
                        {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={() => updateCustomField(index, { required: !field.required })}
                        className={`h-10 rounded-xl px-3 text-[10px] font-bold transition-all ${
                          field.required
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {field.required ? 'Required' : 'Optional'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCustomField(index)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100"
                        aria-label={`Remove custom field ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="mt-3 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dropdown Options</label>
                      <input
                        type="text"
                        value={(field.options || []).join(', ')}
                        onChange={(event) => updateCustomField(index, {
                          options: event.currentTarget.value
                            .split(',')
                            .map((option) => option.trim())
                            .filter(Boolean),
                        })}
                        placeholder="Option one, Option two, Option three"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs sticky top-0">
          <div className="mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preview</span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Application Preview</h3>
            <p className="text-[11px] text-slate-400 font-medium">All applicant-facing fields are shown below.</p>
          </div>

          <div className="max-h-[calc(100vh-230px)] overflow-y-auto bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-6">
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-900">Apply for this role</h4>
              <p className="text-[10px] text-slate-400 font-medium italic">Review the complete applicant-facing form.</p>
            </div>

            <div className="space-y-4">
              {includedStandardFields.map((field) => {
                const config = getFieldConfig(field.id);
                return (
                  <PreviewField
                    key={field.id}
                    label={field.label}
                    type="Short Text"
                    required={Boolean(config.required)}
                  />
                );
              })}

              {customFields.map((field, index) => (
                <PreviewField
                  key={field.id || `custom-preview-${index}`}
                  label={field.label?.trim() || `Custom question ${index + 1}`}
                  type={FIELD_TYPE_LABELS[field.type || 'shortText']}
                  required={Boolean(field.required)}
                  tall={field.type === 'longText'}
                />
              ))}

              {includedStandardFields.length === 0 && customFields.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
                  <p className="text-[10px] font-bold text-slate-400">No applicant fields selected yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewField({
  label,
  type,
  required,
  tall = false,
}: {
  label: string;
  type: string;
  required: boolean;
  tall?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold text-slate-700">{label}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded border border-slate-100 bg-white px-1 text-[7px] font-extrabold uppercase tracking-widest text-slate-300">{type}</span>
          {required && (
            <span className="rounded bg-blue-50 px-1 text-[7px] font-extrabold uppercase tracking-widest text-blue-400">Required</span>
          )}
        </div>
      </div>
      <div className={`w-full bg-white border border-slate-100 rounded-lg shadow-sm ${tall ? 'h-20' : 'h-10'}`} />
    </div>
  );
}
