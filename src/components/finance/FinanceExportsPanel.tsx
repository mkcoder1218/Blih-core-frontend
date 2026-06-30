import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, SlidersHorizontal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEmployees } from '../../hooks/useHrRecords';
import type { EmployeeRecord } from '../../api/types';

type Props = {
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
};

const EXPORT_COLUMNS = [
  'S.no',
  'First name',
  'Second Name',
  'Last name',
  'Phone Number',
  'Types of Disadvantage group',
  'Gender',
  'Age group',
  'Product and SME created YiW',
  'Region',
  'Types of employment',
  'Types of YIW',
  'Level of YIW',
  'Participant employment status',
  'Participants Employment start date',
  'Gross salary',
  'MoVs (payment sleep, Payment sheet, Contract agreement etc)',
  'Remark',
];

function csvCell(value: unknown) {
  const text = value == null || value === '' ? '-' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function grossSalary(employee: EmployeeRecord) {
  return Number(employee.salaryInfo?.baseSalary ?? 0);
}

function employeeName(employee: EmployeeRecord) {
  return employee.user?.fullName || employee.user?.email || 'Unnamed employee';
}

function splitName(employee: EmployeeRecord) {
  const parts = employeeName(employee).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    secondName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  };
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function phoneAsText(value?: unknown) {
  const phone = value == null ? '' : String(value).trim();
  return phone ? `="${phone.replace(/"/g, '""')}"` : '';
}

function mapEmploymentType(value?: string | null) {
  if (value === 'intern') return 'Internship';
  if (value === 'contract') return 'Contract';
  if (value === 'part_time') return 'Part-time';
  return 'Wage-employment';
}

function mapEmploymentStatus(value?: string | null) {
  if (value === 'active') return 'currently employed';
  if (value === 'terminated' || value === 'left') return 'not currently employed';
  return value || '';
}

export default function FinanceExportsPanel({ showAlert }: Props) {
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [employeeLimit, setEmployeeLimit] = useState(250);
  const { data, isLoading, isError, refetch } = useEmployees({ limit: employeeLimit, offset: 0 });

  const employees = data?.employees ?? [];
  const totalEmployees = data?.total ?? employees.length;
  const totalGrossSalary = useMemo(
    () => employees.reduce((sum, employee) => sum + grossSalary(employee), 0),
    [employees]
  );

  const handleExport = async () => {
    try {
      const result = await refetch();
      const rows = result.data?.employees ?? employees;
      if (!rows.length) {
        showAlert('No employee data available to export.', 'info');
        return;
      }

      const csvRows = [
        ['Temporary/ Permanenet Employees list', ...Array(EXPORT_COLUMNS.length - 1).fill('')].map(csvCell).join(','),
        EXPORT_COLUMNS.map(csvCell).join(','),
        ...rows.map((employee, index) => {
          const metadata = employee.metadata ?? {};
          const names = splitName(employee);
          return [
            index + 1,
            names.firstName,
            names.secondName,
            names.lastName,
            phoneAsText(metadata.additionalPhone || employee.user?.phone),
            metadata.disadvantageGroup || metadata.disadvantage_group || '',
            metadata.gender || '',
            metadata.ageGroup || metadata.age_group || '',
            metadata.yiwProduct || metadata.productAndSmeCreatedYiw || 'Micro enterprise',
            metadata.region || metadata.city || '',
            metadata.typesOfEmployment || mapEmploymentType(employee.employmentType),
            metadata.typesOfYiw || metadata.typesOfYIW || '',
            metadata.levelOfYiw || metadata.levelOfYIW || '',
            metadata.participantEmploymentStatus || mapEmploymentStatus(employee.employmentStatus),
            formatDate(employee.hireDate),
            grossSalary(employee),
            metadata.movs || metadata.paymentMovs || '',
            metadata.remark || metadata.remarks || '',
          ].map(csvCell).join(',');
        }),
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employee-list-yiw-tracking-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showAlert(`Exported ${rows.length} employees.`, 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.error || 'Unable to export employee data.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="rounded-lg border-slate-200 bg-white shadow-xs">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-black text-slate-900">Business Admin Employee Export</CardTitle>
              <CardDescription className="text-xs font-medium">
                Export employee records with gross salary included in the finance-ready format.
              </CardDescription>
            </div>
          </div>
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => setLimitModalOpen(true)}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Limits
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-5 pt-1">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Users className="h-3.5 w-3.5" />
                Employees
              </div>
              <p className="mt-1 text-lg font-black text-slate-900">{employees.length} / {totalEmployees}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Export Limit</p>
              <p className="mt-1 text-lg font-black text-slate-900">{employeeLimit}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Salary</p>
              <p className="mt-1 text-lg font-black text-blue-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(totalGrossSalary)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-500">Columns: {EXPORT_COLUMNS.join(', ')}</p>
            <Button onClick={handleExport} disabled={isLoading || isError}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={limitModalOpen} onOpenChange={setLimitModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Export Limit</DialogTitle>
            <DialogDescription>Set the maximum number of employee records included in this export.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="employee-export-limit">
              Employee limit
            </label>
            <Input
              id="employee-export-limit"
              type="number"
              min={1}
              max={5000}
              value={employeeLimit}
              onChange={(event) => setEmployeeLimit(Math.max(1, Math.min(5000, Number(event.target.value) || 1)))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLimitModalOpen(false)}>Close</Button>
            <Button onClick={() => setLimitModalOpen(false)}>Apply Limit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
