import { useMemo } from "react";
import { useEmployees } from "../../../hooks/useHrRecords";

type Props = {
  value?: string;
  onChange: (employeeId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  departmentId?: string | null;
};

export function EmployeeSelect({
  value,
  onChange,
  placeholder = "Select employee",
  disabled = false,
  departmentId,
}: Props) {
  const { data, isLoading } = useEmployees({ limit: 100, offset: 0 });
  const employees = useMemo(() => {
    const rows = data?.employees ?? [];
    if (!departmentId) return rows;
    return rows.filter((employee: any) => {
      const employeeDepartmentId = employee.departmentId || employee.department?.id || employee.Department?.id;
      return String(employeeDepartmentId || "") === String(departmentId);
    });
  }, [data?.employees, departmentId]);

  const emptyLabel = departmentId
    ? "No employees found in this department"
    : "No employees found";

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.currentTarget.value)}
      disabled={disabled}
      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 disabled:bg-slate-50"
    >
      <option value="">{isLoading ? "Loading employees..." : placeholder}</option>
      {!isLoading && employees.length === 0 ? <option value="" disabled>{emptyLabel}</option> : null}
      {employees.map((employee: any) => (
        <option key={employee.id} value={employee.id}>
          {employee.user?.fullName || employee.fullName || employee.employeeCode || employee.id}
        </option>
      ))}
    </select>
  );
}
