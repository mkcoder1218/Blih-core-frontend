import { useEmployees } from "../../../hooks/useHrRecords";

type Props = {
  value?: string;
  onChange: (employeeId: string) => void;
  placeholder?: string;
};

export function EmployeeSelect({ value, onChange, placeholder = "Select employee" }: Props) {
  const { data, isLoading } = useEmployees({ limit: 100, offset: 0 });
  const employees = data?.employees ?? [];

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
    >
      <option value="">{isLoading ? "Loading employees..." : placeholder}</option>
      {employees.map((employee: any) => (
        <option key={employee.id} value={employee.id}>
          {employee.user?.fullName || employee.fullName || employee.employeeCode || employee.id}
        </option>
      ))}
    </select>
  );
}
