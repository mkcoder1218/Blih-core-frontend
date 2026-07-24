import { motion } from "motion/react";
import { useEmployeeForm } from "./context";
import { FormField, inputClass } from "./FormField";

export default function AccountStep() {
  const { formData, handleInputChange, mode } = useEmployeeForm();
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-bold text-slate-900">Account Essentials</h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="First Name" required><input name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Last Name" required><input name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Email Address" required><input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Phone Number"><input name="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label={mode === "update" ? "New Password" : "Initial Password"} required={mode === "create"} className="sm:col-span-2">
          <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder={mode === "update" ? "Leave empty to keep current password" : "Create user's first login password"} className={inputClass} />
        </FormField>
      </div>
    </motion.div>
  );
}
