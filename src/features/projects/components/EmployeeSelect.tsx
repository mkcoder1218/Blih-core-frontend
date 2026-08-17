import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useEmployees } from "../../../hooks/useHrRecords";
import { useProject } from "../hooks";

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
  const location = useLocation();
  const routedProjectId = useMemo(() => {
    const match = location.pathname.match(/\/projects\/([0-9a-fA-F-]{36})(?:\/|$)/);
    return match?.[1] || undefined;
  }, [location.pathname]);

  const project = useProject(departmentId === undefined ? routedProjectId : undefined);
  const effectiveDepartmentId = departmentId === undefined
    ? project.data?.departmentId || null
    : departmentId;

  const { data, isLoading } = useEmployees({
    limit: 100,
    offset: 0,
    ...(effectiveDepartmentId ? { departmentId: effectiveDepartmentId } : {}),
  });

  const employees = useMemo(() => {
    const rows = data?.employees ?? [];
    if (!effectiveDepartmentId) return rows;
    return rows.filter((employee: any) => {
      const employeeDepartmentId = employee.departmentId || employee.department?.id || employee.Department?.id;
      return String(employeeDepartmentId || "") === String(effectiveDepartmentId);
    });
  }, [data?.employees, effectiveDepartmentId]);

  const loading = isLoading || (departmentId === undefined && Boolean(routedProjectId) && project.isLoading);
  const emptyLabel = effectiveDepartmentId
    ? "No employees found in this department"
    : "No employees found";

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.currentTarget.value)}
      disabled={disabled || loading}
      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 disabled:bg-slate-50"
    >
      <option value="">{loading ? "Loading employees..." : placeholder}</option>
      {!loading && employees.length === 0 ? <option value="" disabled>{emptyLabel}</option> : null}
      {employees.map((employee: any) => (
        <option key={employee.id} value={employee.id}>
          {employee.user?.fullName || employee.fullName || employee.employeeCode || employee.id}
        </option>
      ))}
    </select>
  );
}
