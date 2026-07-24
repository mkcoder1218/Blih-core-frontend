import { UserSearchSelect } from "../UserSearchSelect";
import { useEmployeeForm } from "./context";
import { FormField, inputClass } from "./FormField";

export default function InternshipSection() {
  const { formData, handleInputChange, setFormData, setInternshipStipendType, isIntern } = useEmployeeForm();
  if (!isIntern) return null;

  return (
    <div className="col-span-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
      <h4 className="mb-4 text-[12px] font-black text-blue-950">Internship Details</h4>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Program / Track"><input name="internshipProgram" value={formData.internshipProgram} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="School / Institution"><input name="internshipInstitution" value={formData.internshipInstitution} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Mentor"><UserSearchSelect value={formData.internshipMentorUserId} onChange={(userId) => setFormData((p) => ({ ...p, internshipMentorUserId: userId }))} placeholder="Search and select mentor..." /></FormField>
        <FormField label="Expected End Date"><input type="date" name="internshipExpectedEndDate" value={formData.internshipExpectedEndDate} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Internship Status"><select name="internshipStatus" value={formData.internshipStatus} onChange={handleInputChange} className={inputClass}><option value="active">Active</option><option value="extended">Extended</option><option value="completed">Completed</option><option value="terminated">Terminated</option></select></FormField>
        <FormField label="Stipend"><div className="grid grid-cols-2 gap-2">{(["paid", "unpaid"] as const).map((value) => <button type="button" key={value} onClick={() => setInternshipStipendType(value)} className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize ${formData.internshipStipendType === value ? "border-blue-600 bg-blue-600 text-white" : "border-blue-100 bg-white text-slate-600"}`}>{value}</button>)}</div></FormField>
        {formData.internshipStipendType === "paid" ? <FormField label="Awash Account" required><input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={(e) => setFormData((p) => ({ ...p, bankName: p.bankName.trim() || "Awash Bank", bankAccountNumber: e.currentTarget.value }))} className={inputClass} /></FormField> : null}
      </div>
    </div>
  );
}
