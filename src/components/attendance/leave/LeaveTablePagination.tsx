import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LeaveTablePaginationProps {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
}

function getPageNumbers(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.min(Math.max(page - 2, 1), totalPages - 4);
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export function LeaveTablePagination({
  page,
  size,
  total,
  totalPages,
  isFetching = false,
  onPageChange,
}: LeaveTablePaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const safePage = Math.min(Math.max(page, 1), safeTotalPages);
  const from = total === 0 ? 0 : (safePage - 1) * size + 1;
  const to = total === 0 ? 0 : Math.min(safePage * size, total);
  const pages = getPageNumbers(safePage, safeTotalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold text-slate-500">
        Showing <span className="font-black text-slate-800">{from}-{to}</span> of{" "}
        <span className="font-black text-slate-800">{total}</span> requests
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={safePage <= 1 || isFetching}
          onClick={() => onPageChange(1)}
          className="h-8 w-8 rounded-lg border-slate-200 shadow-none"
          aria-label="First page"
        >
          <ChevronFirst className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={safePage <= 1 || isFetching}
          onClick={() => onPageChange(safePage - 1)}
          className="h-8 w-8 rounded-lg border-slate-200 shadow-none"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-1 flex items-center gap-1">
          {pages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              disabled={isFetching}
              onClick={() => onPageChange(pageNumber)}
              className={cn(
                "h-8 min-w-8 rounded-lg px-2 text-xs font-black transition-colors",
                pageNumber === safePage
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {pageNumber}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={safePage >= safeTotalPages || isFetching}
          onClick={() => onPageChange(safePage + 1)}
          className="h-8 w-8 rounded-lg border-slate-200 shadow-none"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={safePage >= safeTotalPages || isFetching}
          onClick={() => onPageChange(safeTotalPages)}
          className="h-8 w-8 rounded-lg border-slate-200 shadow-none"
          aria-label="Last page"
        >
          <ChevronLast className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
