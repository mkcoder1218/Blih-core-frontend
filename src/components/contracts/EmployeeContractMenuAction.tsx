import {
  type MouseEvent,
  useMemo,
} from "react";

import {
  Eye,
  FileSignature,
  Loader2,
} from "lucide-react";

import {
  useEmploymentContracts,
} from "../../hooks/useEmploymentContracts";

interface EmployeeContractMenuActionProps {
  employee: any;

  onAssign: (
    employee: any,
  ) => void;

  onView: (
    contractId: string,
  ) => void;
}

const VIEWABLE_STATUSES = [
  "DRAFT",
  "READY",
  "SENT",
  "VIEWED",
  "PARTIALLY_SIGNED",
  "SIGNED",
  "ACTIVE",
  "EXPIRING",
] as const;

function getEmployeeRecordId(
  employee: any,
): string {
  return String(
    employee?.employeeRecordId ||
      employee?.id ||
      "",
  );
}

export default function EmployeeContractMenuAction({
  employee,
  onAssign,
  onView,
}: EmployeeContractMenuActionProps) {
  const employeeRecordId =
    getEmployeeRecordId(
      employee,
    );

  const contractQuery =
    useEmploymentContracts({
      employeeRecordId,
      limit: 20,
      offset: 0,
    });

  const activeContract =
    useMemo(() => {
      const rows =
        contractQuery.data?.rows ||
        [];

      return (
        rows.find(
          (contract) =>
            VIEWABLE_STATUSES.includes(
              contract.status as
                (typeof VIEWABLE_STATUSES)[number],
            ),
        ) || null
      );
    }, [
      contractQuery.data?.rows,
    ]);

  const checkingContract =
    contractQuery.isLoading ||
    contractQuery.isFetching;

  const handleClick = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    if (activeContract) {
      onView(
        activeContract.id,
      );

      return;
    }

    onAssign(
      employee,
    );
  };

  return (
    <button
      type="button"
      onClick={
        handleClick
      }
      disabled={
        checkingContract
      }
      className="flex w-full items-center gap-2.5 px-4 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60"
    >
      {checkingContract ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : activeContract ? (
        <Eye className="h-3.5 w-3.5" />
      ) : (
        <FileSignature className="h-3.5 w-3.5" />
      )}

      {checkingContract
        ? "Checking Contract..."
        : activeContract
          ? "View Contract"
          : "Assign Contract"}
    </button>
  );
}
