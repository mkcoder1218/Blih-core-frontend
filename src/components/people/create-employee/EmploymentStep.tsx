import { motion } from "motion/react";
import { PlusCircle } from "lucide-react";
import { UserSearchSelect } from "../UserSearchSelect";
import { EMPLOYMENT_STATUS_OPTIONS, EMPLOYMENT_TYPE_OPTIONS } from "../../../constants/employee";
import { useEmployeeForm } from "./context";
import { FormField, inputClass } from "./FormField";
import InternshipSection from "./InternshipSection";
import ProbationSection from "./ProbationSection";

export default function EmploymentStep() {
  const {
    formData, setFormData, handleInputChange, departments, departmentPositions,
    positionsLoading, systemRoles, canCreateDepartment, canCreatePosition,
    setShowCreateDept, setShowCreatePos,
  } = useEmployeeForm();

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-sm font-bold text-slate-900">Employment Details</h3>
        <div className="flex gap-4">
          {canCreateDepartment ? <button type="button" onClick={() => setShowCreateDept(true)} className="flex items-center gap-1 text-[10px] font-bold text-blue-600"><PlusCircle className="h-3 w-3" />Create Department</button> : null}
          {canCreatePosition ? <button type="button" onClick={() => setShowCreatePos(true)} className="flex items-center gap-1 text-[10px] font-bold text-blue-600"><PlusCircle className="h-3 w-3" />Create Position</button> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Employee Code"><input name="employeeCode" value={formData.employeeCode} onChange={handleInputChange} placeholder="Leave empty to auto-generate" className={inputClass} /></FormField>
        <FormField label="System Role" required><select name="systemRole" value={formData.systemRole} onChange={handleInputChange} className={inputClass}><option value="">Select System Role</option>{systemRoles.map((role) => <option key={role.id || role.name} value={role.name}>{role.name}</option>)}</select></FormField>
        <FormField label="Department" required><select name="departmentId" value={formData.departmentId} onChange={(e) => setFormData((p) => ({ ...p, departmentId: e.currentTarget.value, positionId: "" }))} className={inputClass}><option value="">Select Department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></FormField>
        <FormField label="Job Position" required><select name="positionId" disabled={!formData.departmentId} value={formData.positionId} onChange={handleInputChange} className={inputClass}><option value="">Select Position</option>{positionsLoading ? <option disabled>Loading positions...</option> : null}{departmentPositions.map((position) => <option key={position.id} value={position.id}>{position.title}</option>)}</select></FormField>
        <FormField label="Reporting To"><UserSearchSelect value={formData.reportingTo} onChange={(userId) => setFormData((p) => ({ ...p, reportingTo: userId }))} placeholder="Search and select manager..." /></FormField>
        <FormField label="Start Date"><input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Probation Period (Months)"><input type="number" min={1} name="probationPeriod" value={formData.probationPeriod} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Employment Type" required><select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className={inputClass}>{EMPLOYMENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FormField>
        <FormField label="Employment Status"><select name="employmentStatus" value={formData.employmentStatus} onChange={handleInputChange} className={inputClass}>{EMPLOYMENT_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FormField>
        <FormField label="Contract Start Date"><input type="date" name="contractStartDate" value={formData.contractStartDate} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Contract End Date"><input type="date" name="contractEndDate" value={formData.contractEndDate} onChange={handleInputChange} className={inputClass} /></FormField>
        <FormField label="Monthly Salary"><input name="monthlySalary" value={formData.monthlySalary} onChange={handleInputChange} placeholder="e.g. 15000" className={inputClass} /></FormField>
        <FormField label="Salary Currency"><input name="salaryCurrency" value={formData.salaryCurrency} onChange={handleInputChange} className={inputClass} /></FormField>
        <ProbationSection />
        <InternshipSection />
        <FormField label="Additional Notes" className="sm:col-span-2"><textarea name="additionalNotes" value={formData.additionalNotes} onChange={handleInputChange} rows={3} className={inputClass} /></FormField>
      </div>
    </motion.div>
  );
}
