import { motion } from "motion/react";
import { useEmployeeForm } from "./context";
import { FormField, inputClass } from "./FormField";

export default function EmergencyStep() {
  const { formData, handleInputChange } = useEmployeeForm();
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-bold text-slate-900">Emergency Contact</h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="First Name"><input name="emergencyFirstName" value={formData.emergencyFirstName} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Last Name"><input name="emergencyLastName" value={formData.emergencyLastName} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Phone Number"><input name="emergencyPhone" value={formData.emergencyPhone} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Email Address"><input type="email" name="emergencyEmail" value={formData.emergencyEmail} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="City"><input name="emergencyCity" value={formData.emergencyCity} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Country"><input name="emergencyCountry" value={formData.emergencyCountry} onChange={handleInputChange} className={inputClass} /></FormField>
      </div>
    </motion.div>
  );
}
