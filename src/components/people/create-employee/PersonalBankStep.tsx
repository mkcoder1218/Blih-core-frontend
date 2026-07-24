import { motion } from "motion/react";
import { useEmployeeForm } from "./context";
import { FormField, inputClass } from "./FormField";

export default function PersonalBankStep() {
  const { formData, handleInputChange } = useEmployeeForm();
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-bold text-slate-900">Personal & Bank Information</h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Date of Birth"><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="City of Residence"><input name="city" value={formData.city} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Country of Birth"><input name="countryOfBirth" value={formData.countryOfBirth} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Additional Phone"><input name="additionalPhone" value={formData.additionalPhone} onChange={handleInputChange} className={inputClass} /></FormField>
        <div className="sm:col-span-2 pt-4"><h4 className="text-[12px] font-bold text-slate-800">Primary Bank Details</h4></div>
        <FormField label="Bank Name"><input name="bankName" value={formData.bankName} onChange={handleInputChange} placeholder="e.g. Awash Bank" className={inputClass} /></FormField>
        <FormField label="Account Number"><input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleInputChange} className={inputClass} /></FormField>
      </div>
    </motion.div>
  );
}
