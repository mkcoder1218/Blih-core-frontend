import { ConfirmDialog, DataTable, StatusBadge } from "@/components/ui/blih";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ChevronLeft,
    ChevronRight,
    Edit2,
    FolderTree,
    Lock,
    Plus,
    Search,
    ShieldAlert,
    SlidersHorizontal,
    Trash2,
    User,
    X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PolicyDocument } from "../../../api/policies";
import { useBrainAuthorization } from "../../../hooks/useBrainAuthorization";
import { useMe } from "../../../hooks/useMe";
import {
    useCreatePolicyDocument,
    useDeletePolicyDocument,
    usePolicyCategories,
    usePolicyList,
    useUpdatePolicyDocument,
} from "../../../hooks/usePolicies";
import { PolicyEditorModal } from "../modal/PolicyEditorModal";
import {
    canCreatePolicy,
    canDeletePolicy,
    canEditPolicy,
} from "../policyPermissions";

// ─── Sort option type ─────────────────────────────────────────────────────────
type SortOption = {
  label: string;
  sortBy: "createdAt" | "updatedAt" | "title" | "effectiveFrom" | "reviewDueAt";
  sortDirection: "ASC" | "DESC";
};

const SORT_OPTIONS: SortOption[] = [
  { label: "Recently created", sortBy: "createdAt",    sortDirection: "DESC" },
  { label: "Oldest first",     sortBy: "createdAt",    sortDirection: "ASC"  },
  { label: "Recently updated", sortBy: "updatedAt",    sortDirection: "DESC" },
  { label: "Title A–Z",        sortBy: "title",        sortDirection: "ASC"  },
  { label: "Title Z–A",        sortBy: "title",        sortDirection: "DESC" },
  { label: "Effective date",   sortBy: "effectiveFrom",sortDirection: "ASC"  },
  { label: "Review due",       sortBy: "reviewDueAt",  sortDirection: "ASC"  },
];

// ─── More-filters popover ─────────────────────────────────────────────────────
interface MoreFiltersProps {
  policyTypeFilter: string;  setPolicyTypeFilter: (v: string) => void;
  visibilityFilter: string;  setVisibilityFilter: (v: string) => void;
  confidentialityFilter: string; setConfidentialityFilter: (v: string) => void;
  mineOnly: boolean; setMineOnly: (v: boolean) => void;
  activeCount: number;
  onClear: () => void;
  onClose: () => void;
}

function MoreFiltersPopover({
  policyTypeFilter, setPolicyTypeFilter,
  visibilityFilter, setVisibilityFilter,
  confidentialityFilter, setConfidentialityFilter,
  mineOnly, setMineOnly,
  activeCount, onClear, onClose,
}: MoreFiltersProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const selectCls =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none bg-white";

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 z-30 mt-1.5 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          More Filters
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-bold text-rose-500 hover:text-rose-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Policy Type */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Policy Type
        </label>
        <Select value={policyTypeFilter} onValueChange={setPolicyTypeFilter}>
          <SelectTrigger className="h-8 w-full rounded-lg text-xs font-medium text-slate-900 border border-slate-200 capitalize">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="w-fit min-w-[200px]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
            <SelectItem value="CODE_OF_CONDUCT">Code of Conduct</SelectItem>
            <SelectItem value="IT_SECURITY">IT Security</SelectItem>
            <SelectItem value="SAFETY">Safety</SelectItem>
            <SelectItem value="HR">HR & Personnel</SelectItem>
            <SelectItem value="FINANCE">Finance</SelectItem>
            <SelectItem value="COMPLIANCE">Compliance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Visibility */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Visibility
        </label>
        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="h-8 w-full rounded-lg text-xs font-medium text-slate-900 border border-slate-200 capitalize">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="w-fit min-w-[200px]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="department">Department</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Confidentiality */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Confidentiality
        </label>
        <Select value={confidentialityFilter} onValueChange={setConfidentialityFilter}>
          <SelectTrigger className="h-8 w-full rounded-lg text-xs font-medium text-slate-900 border border-slate-200 capitalize">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="w-fit min-w-[200px]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="confidential">Confidential</SelectItem>
            <SelectItem value="restricted">Restricted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* My Owned Policies */}
      <label className="flex items-center gap-2.5 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={mineOnly}
          onChange={(e) => setMineOnly((e.target as HTMLInputElement).checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-xs font-bold text-slate-700">My Owned Policies only</span>
      </label>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface BrainPoliciesTabProps {
  onNavigateToCategories?: () => void;
}

export function BrainPoliciesTab({ onNavigateToCategories }: BrainPoliciesTabProps) {
  const meRes = useMe();
  const meData = meRes.data?.data;
  const currentUser = meData?.user;
  const { policyActions, isSuperAdmin } = useBrainAuthorization();

  const userPermissionCtx = useMemo(
    () => ({
      userId: currentUser?.id,
      isSuperAdmin: Boolean(isSuperAdmin),
      isBusinessAdmin: Boolean(
        meData?.roles?.includes("BUSINESS_ADMIN") || meData?.roles?.includes("Business Admin")
      ),
      permissions: meData?.permissions || [],
    }),
    [currentUser, isSuperAdmin, meData]
  );

  const canView = policyActions.canView || isSuperAdmin || Boolean(
    meData?.roles?.includes("BUSINESS_ADMIN") || meData?.roles?.includes("Business Admin")
  );

  // ── Primary filters (visible in toolbar) ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryIdFilter, setCategoryIdFilter] = useState("all");

  // ── More-filters (hidden in popover) ──
  const [policyTypeFilter, setPolicyTypeFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [confidentialityFilter, setConfidentialityFilter] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [requiresAcceptanceFilter, setRequiresAcceptanceFilter] = useState<boolean | undefined>(undefined);
  const [requiresSignatureFilter, setRequiresSignatureFilter] = useState<boolean | undefined>(undefined);

  // ── Sort ──
  const [sortIdx, setSortIdx] = useState(0); // index into SORT_OPTIONS
  const { sortBy, sortDirection } = SORT_OPTIONS[sortIdx];

  // ── Pagination ──
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Popover open state ──
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  // ── Modal state ──
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyDocument | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<PolicyDocument | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // ── Categories ──
  const { data: categoryData } = usePolicyCategories({ page: 1, size: 100, status: "active" }, { enabled: canView });
  const categories = categoryData?.rows || [];

  // ── Active more-filter count (badge) ──
  const moreActiveCount = [
    policyTypeFilter !== "all",
    visibilityFilter !== "all",
    confidentialityFilter !== "all",
    mineOnly,
    requiresAcceptanceFilter !== undefined,
    requiresSignatureFilter !== undefined,
  ].filter(Boolean).length;

  // ── Has any active filter (for Clear all) ──
  const hasAnyFilter =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    categoryIdFilter !== "all" ||
    moreActiveCount > 0;

  function clearAllFilters() {
    setSearch("");
    setStatusFilter("all");
    setCategoryIdFilter("all");
    setPolicyTypeFilter("all");
    setVisibilityFilter("all");
    setConfidentialityFilter("all");
    setMineOnly(false);
    setRequiresAcceptanceFilter(undefined);
    setRequiresSignatureFilter(undefined);
    setPage(1);
  }

  function clearMoreFilters() {
    setPolicyTypeFilter("all");
    setVisibilityFilter("all");
    setConfidentialityFilter("all");
    setMineOnly(false);
    setRequiresAcceptanceFilter(undefined);
    setRequiresSignatureFilter(undefined);
  }

  // ── Query params ──
  const queryParams = useMemo(() => {
    const p: any = { page, size: pageSize, sortBy, sortDirection };
    if (search.trim())               p.search = search.trim();
    if (categoryIdFilter !== "all")  p.categoryId = categoryIdFilter;
    if (policyTypeFilter !== "all")  p.policyType = policyTypeFilter;
    if (statusFilter !== "all")      p.status = statusFilter;
    if (visibilityFilter !== "all")  p.visibility = visibilityFilter;
    if (confidentialityFilter !== "all") p.confidentialityLevel = confidentialityFilter;
    if (mineOnly)                    p.mine = true;
    if (requiresAcceptanceFilter !== undefined) p.requiresAcceptance = requiresAcceptanceFilter;
    if (requiresSignatureFilter !== undefined)  p.requiresSignature = requiresSignatureFilter;
    return p;
  }, [page, pageSize, sortBy, sortDirection, search, categoryIdFilter, policyTypeFilter,
      statusFilter, visibilityFilter, confidentialityFilter, mineOnly,
      requiresAcceptanceFilter, requiresSignatureFilter]);

  const { data: policyData, isLoading, isError, error } = usePolicyList(queryParams, { enabled: canView });
  const createMut = useCreatePolicyDocument();
  const updateMut = useUpdatePolicyDocument();
  const deleteMut = useDeletePolicyDocument();

  const policies    = policyData?.rows   || [];
  const totalCount  = policyData?.count  || 0;
  const totalPages  = policyData?.pages  || 1;

  const handleEditorSubmit = async (input: any): Promise<PolicyDocument> => {
    if (editingPolicy) return await updateMut.mutateAsync({ id: editingPolicy.id, input });
    return await createMut.mutateAsync(input);
  };

  const confirmDelete = async () => {
    if (!deletingPolicy) return;
    setDeleteErrorMessage(null);
    try {
      await deleteMut.mutateAsync(deletingPolicy.id);
      setDeletingPolicy(null);
    } catch (err: any) {
      setDeleteErrorMessage(err?.response?.data?.message || err?.message || "Failed to delete policy.");
    }
  };

  // ── Shared input/select classes ──
  const inputCls = "h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none";
  const selectCls = `${inputCls} pr-7`;

  if (!canView) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-black text-rose-950">Access Restricted</h2>
          <p className="mt-2 text-xs font-medium text-rose-800">
            You do not have permission to view Policy Documents.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-100/70 px-3 py-1.5 text-[11px] font-bold text-rose-800">
            <Lock className="h-3.5 w-3.5" />
            Requires: <code className="font-mono text-rose-900">policy.document.view</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 z-10" />
          <Input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search policies…"
            className="h-9 w-full pl-9 rounded-lg border border-slate-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 z-10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status */}
        <div>
          <Select
            value={statusFilter}
            onValueChange={(val) => { setStatusFilter(val); setPage(1); }}
          >
            <SelectTrigger className="h-9 w-full sm:w-auto px-3 rounded-lg text-xs font-medium text-slate-900 border border-slate-200 capitalize flex items-center gap-1.5">
              <span className="text-slate-400 font-bold shrink-0">Status:</span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="w-fit min-w-[200px]">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="changes_requested">Changes Requested</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="superseded">Superseded</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div>
          <Select
            value={categoryIdFilter}
            onValueChange={(val) => { setCategoryIdFilter(val); setPage(1); }}
          >
            <SelectTrigger className="h-9 w-full sm:w-auto px-3 rounded-lg text-xs font-medium text-slate-900 border border-slate-200 capitalize flex items-center gap-1.5">
              <span className="text-slate-400 font-bold shrink-0">Category:</span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="w-fit min-w-[200px]">
              <SelectItem value="all">All</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* More Filters button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreFiltersOpen((o) => !o)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-colors ${
              moreActiveCount > 0
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>More Filters</span>
            {moreActiveCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">
                {moreActiveCount}
              </span>
            )}
          </button>

          {moreFiltersOpen && (
            <MoreFiltersPopover
              policyTypeFilter={policyTypeFilter}      setPolicyTypeFilter={(v) => { setPolicyTypeFilter(v); setPage(1); }}
              visibilityFilter={visibilityFilter}       setVisibilityFilter={(v) => { setVisibilityFilter(v); setPage(1); }}
              confidentialityFilter={confidentialityFilter} setConfidentialityFilter={(v) => { setConfidentialityFilter(v); setPage(1); }}
              mineOnly={mineOnly}                       setMineOnly={(v) => { setMineOnly(v); setPage(1); }}
              activeCount={moreActiveCount}
              onClear={clearMoreFilters}
              onClose={() => setMoreFiltersOpen(false)}
            />
          )}
        </div>

        {/* Sort */}
        <div>
          <Select
            value={String(sortIdx)}
            onValueChange={(val) => { setSortIdx(Number(val)); setPage(1); }}
          >
            <SelectTrigger className="h-9 w-full sm:w-auto px-3 rounded-lg text-xs font-medium text-slate-900 border border-slate-200 capitalize flex items-center gap-1.5">
              <span className="text-slate-400 font-bold shrink-0">Sort:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-fit min-w-[200px]">
              {SORT_OPTIONS.map((opt, i) => (
                <SelectItem key={i} value={String(i)}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear filters — only when active */}
        {hasAnyFilter && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Categories (secondary) */}
        {onNavigateToCategories && (
          <button
            type="button"
            onClick={onNavigateToCategories}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FolderTree className="h-4 w-4 text-blue-600" />
            Categories
          </button>
        )}

        {/* Create Policy (primary) */}
        {canCreatePolicy(userPermissionCtx) && (
          <button
            type="button"
            onClick={() => { setEditingPolicy(null); setIsEditorOpen(true); }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Policy
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <DataTable
        loading={isLoading}
        columns={["Title & Summary", "Category", "Author", "Visibility", "Status", "Version", "Updated", "Actions"]}
        rows={policies}
        emptyMessage={
          isError
            ? ((error as any)?.response?.data?.message || "Failed to load policies")
            : "No policy documents match your filters."
        }
        renderRow={(policy) => {
          const editable  = canEditPolicy(userPermissionCtx, policy);
          const deletable = canDeletePolicy(userPermissionCtx, policy);
          return (
            <tr key={policy.id} className="border-b border-slate-100 hover:bg-slate-50/60">
              <td className="py-3.5 px-4">
                <div className="space-y-0.5">
                  <span className="block text-xs font-extrabold text-slate-900">{policy.title}</span>
                  {policy.summary && <span className="text-[11px] text-slate-400">{policy.summary}</span>}
                </div>
              </td>
              <td className="py-3.5 px-4">
                {policy.category
                  ? <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">{policy.category.name}</span>
                  : <span className="italic text-[11px] text-slate-400">Uncategorized</span>}
              </td>
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-800">
                    {policy.owner?.fullName || policy.owner?.email || "System User"}
                  </span>
                </div>
              </td>
              <td className="py-3.5 px-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                  policy.visibility === "company"    ? "bg-blue-50 text-blue-700"
                  : policy.visibility === "department" ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-700"
                }`}>
                  {policy.visibility.toUpperCase()}
                </span>
              </td>
              <td className="py-3.5 px-4"><StatusBadge status={policy.status} /></td>
              <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-600">v{policy.version}</td>
              <td className="py-3.5 px-4 text-[11px] text-slate-500">
                {new Date(policy.updatedAt).toLocaleDateString()}
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  {editable && (
                    <button type="button" title="Edit"
                      onClick={() => { setEditingPolicy(policy); setIsEditorOpen(true); }}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {deletable && (
                    <button type="button" title="Delete"
                      onClick={() => { setDeleteErrorMessage(null); setDeletingPolicy(policy); }}
                      className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        }}
      />

      {/* ── Pagination ────────────────────────────────────────────────────────── */}
      {!isLoading && totalCount > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs">
          <div className="font-medium text-slate-500">
            Showing <strong>{policies.length}</strong> of <strong>{totalCount}</strong> policies
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number((e.target as HTMLSelectElement).value)); setPage(1); }}
              className="ml-2 rounded-lg border border-slate-200 px-2 py-1 font-medium text-slate-700"
            >
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n} per page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="font-bold text-slate-700">Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <PolicyEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSubmit={handleEditorSubmit}
        initialData={editingPolicy}
        categories={categories}
        isSubmitting={createMut.isPending || updateMut.isPending}
      />

      <ConfirmDialog
        open={Boolean(deletingPolicy)}
        onClose={() => setDeletingPolicy(null)}
        onConfirm={confirmDelete}
        title="Delete Policy Document"
        description={deletingPolicy ? `Delete "${deletingPolicy.title}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
