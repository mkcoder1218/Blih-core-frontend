import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  FolderTree,
  User,
  ArrowUpDown,
  Lock,
  Building2,
  Globe,
  FileCheck,
  AlertTriangle,
  Info,
  CornerUpLeft,
} from "lucide-react";
import {
  useProcedures,
  useCreateProcedure,
  useUpdateProcedure,
  useDeleteProcedure,
  useRestoreProcedure,
} from "../../../hooks/useProcedures";
import { useBrainCategories } from "../../../hooks/useBrain";
import { useEmployees } from "../../../hooks/useHrRecords";
import { useDepartments } from "../../../hooks/useDepartments";
import { useBrainAuthorization } from "../../../hooks/useBrainAuthorization";
import { useMe } from "../../../hooks/useMe";
import { Procedure } from "../../../api/procedures";
import { ProcedureEditorModal } from "../modal/ProcedureEditorModal";
import { ProcedureDetailModal } from "../modal/ProcedureDetailModal";
import {
  canCreateProcedure,
  canEditProcedure,
  canDeleteProcedure,
  canRestoreProcedure,
} from "../procedurePermissions";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface BrainProceduresTabProps {
  onNavigateToCategories?: () => void;
}

export function BrainProceduresTab({ onNavigateToCategories }: BrainProceduresTabProps) {
  const meRes = useMe();
  const meData = meRes.data?.data;
  const currentUser = meData?.user;
  const { procedureActions, isSuperAdmin } = useBrainAuthorization();

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

  const canView = procedureActions.canView || isSuperAdmin;

  // Filter & Pagination state
  const [search, setSearch] = useState("");
  const [categoryIdFilter, setCategoryIdFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [viewingProcedureId, setViewingProcedureId] = useState<string | null>(null);
  const [deletingProcedure, setDeletingProcedure] = useState<Procedure | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch helper collections
  const { data: categoryData } = useBrainCategories(
    { page: 1, size: 100, status: "active" },
    { enabled: canView }
  );
  const categories = categoryData?.rows || [];

  const { data: departmentData } = useDepartments({ size: 1000 });
  const departments = departmentData?.departments || [];

  // Query Parameters
  const queryParams = useMemo(() => {
    const p: any = {
      page,
      size: pageSize,
      sortBy: "updatedAt",
      sortDirection: "DESC",
    };
    if (search.trim()) p.search = search.trim();
    if (categoryIdFilter !== "all") p.categoryId = categoryIdFilter;
    if (statusFilter !== "all") p.status = statusFilter;
    if (visibilityFilter !== "all") p.visibility = visibilityFilter;
    if (departmentFilter !== "all") p.responsibleDepartmentId = departmentFilter;
    if (mineOnly) p.mine = true;
    return p;
  }, [
    page,
    pageSize,
    search,
    categoryIdFilter,
    statusFilter,
    visibilityFilter,
    departmentFilter,
    mineOnly,
  ]);

  const { data: procedureData, isLoading, isError, error, refetch } = useProcedures(queryParams, {
    enabled: canView,
  });

  const createMutation = useCreateProcedure();
  const updateMutation = useUpdateProcedure();
  const deleteMutation = useDeleteProcedure();
  const restoreMutation = useRestoreProcedure();

  const procedures = procedureData?.rows || [];
  const totalCount = procedureData?.count || 0;
  const totalPages = procedureData?.pages || 1;

  // Selected viewing procedure detail details hook
  const activeViewingProcedure = useMemo(() => {
    if (!viewingProcedureId) return null;
    return procedures.find((p) => p.id === viewingProcedureId) || null;
  }, [viewingProcedureId, procedures]);

  const handleEditorSubmit = async (input: any) => {
    if (editingProcedure) {
      await updateMutation.mutateAsync({ id: editingProcedure.id, input });
    } else {
      await createMutation.mutateAsync(input);
    }
    refetch();
  };

  const confirmDelete = async () => {
    if (!deletingProcedure) return;
    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(deletingProcedure.id);
      setDeletingProcedure(null);
      refetch();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to delete procedure.");
    }
  };

  const confirmRestore = async (proc: Procedure) => {
    setErrorMessage(null);
    try {
      await restoreMutation.mutateAsync(proc.id);
      refetch();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to restore procedure.");
    }
  };

  if (!canView) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-black text-rose-950">Access Restricted</h2>
          <p className="mt-2 text-xs font-medium text-rose-800">
            You do not have permission to view Company Procedures.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-100/70 px-3 py-1.5 text-[11px] font-bold text-rose-800">
            <Lock className="h-3.5 w-3.5" />
            Requires: <code className="font-mono text-rose-900">procedures.procedure.view</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 antialiased">
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <span className="font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 z-10" />
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search procedures by title, scope, purpose..."
                className="h-9 w-full sm:w-72 rounded-lg pl-10 pr-3.5 text-xs font-medium text-slate-900 border border-slate-200"
              />
            </div>

            {/* Category */}
            <div>
              <Select
                value={categoryIdFilter}
                onValueChange={(val) => {
                  setCategoryIdFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-auto px-3 rounded-lg text-xs font-medium text-slate-900 border border-slate-200 capitalize flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold shrink-0">Category:</span>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="w-fit min-w-[200px]">
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
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
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visibility */}
            <div>
              <Select
                value={visibilityFilter}
                onValueChange={(val) => {
                  setVisibilityFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-auto px-3 rounded-lg text-xs font-medium text-slate-900 border border-slate-200 capitalize flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold shrink-0">Visibility:</span>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="w-fit min-w-[200px]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="company">Company Wide</SelectItem>
                  <SelectItem value="department">Department Restricted</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div>
              <Select
                value={departmentFilter}
                onValueChange={(val) => {
                  setDepartmentFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-auto px-3 rounded-lg text-xs font-medium text-slate-900 border border-slate-200 capitalize flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold shrink-0">Department:</span>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="w-fit min-w-[200px]">
                  <SelectItem value="all">All</SelectItem>
                  {departments.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            {canCreateProcedure(userPermissionCtx) && (
              <button
                type="button"
                onClick={() => {
                  setEditingProcedure(null);
                  setIsEditorOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Procedure</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters checklist secondary bar */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-3">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => {
                  setMineOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Assigned to me / Owned by me</span>
            </label>
          </div>

          {onNavigateToCategories && (
            <button
              type="button"
              onClick={onNavigateToCategories}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              <FolderTree className="h-4 w-4" />
              <span>Manage Categories</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table List */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-xs font-bold">Fetching company procedures...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-600 space-y-2">
            <AlertTriangle className="h-8 w-8 mx-auto" />
            <p className="text-xs font-bold">Failed to load procedures list.</p>
            <p className="text-[10px] text-slate-400">{(error as any)?.message}</p>
          </div>
        ) : procedures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <BookOpen className="h-10 w-10 text-slate-300" />
            <p className="text-xs font-bold">No operating procedures found matching search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10.5px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Visibility</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {procedures.map((proc) => {
                  const procEditable = canEditProcedure(userPermissionCtx, proc);
                  const procDeletable = canDeleteProcedure(userPermissionCtx, proc);
                  const procRestorable = canRestoreProcedure(userPermissionCtx, proc);

                  return (
                    <tr
                      key={proc.id}
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                        proc.deletedAt ? "bg-rose-50/20 text-slate-400" : ""
                      }`}
                      onClick={() => setViewingProcedureId(proc.id)}
                    >
                      <td className="py-4 px-5 font-bold text-slate-900">
                        <div className="space-y-0.5">
                          <p>{proc.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold">v{proc.version}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {proc.category?.name || <span className="text-slate-400 italic">Uncategorized</span>}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            proc.status === "published"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : proc.status === "in_review"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : proc.status === "approved"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : proc.status === "changes_requested"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {proc.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1">
                          {proc.visibility === "company" ? (
                            <Globe className="h-3.5 w-3.5 text-blue-500" />
                          ) : proc.visibility === "department" ? (
                            <Building2 className="h-3.5 w-3.5 text-amber-500" />
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-slate-500" />
                          )}
                          <span className="capitalize">{proc.visibility}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {new Date(proc.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {procEditable && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProcedure(proc);
                                setIsEditorOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}

                          {procDeletable && (
                            <button
                              type="button"
                              onClick={() => setDeletingProcedure(proc)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                          {procRestorable && proc.deletedAt && (
                            <button
                              type="button"
                              onClick={() => confirmRestore(proc)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                              title="Restore"
                            >
                              <CornerUpLeft className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing page <strong className="text-slate-800">{page}</strong> of{" "}
              <strong className="text-slate-800">{totalPages}</strong> ({totalCount} total procedures)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <ProcedureEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingProcedure(null);
        }}
        onSubmit={handleEditorSubmit}
        initialData={editingProcedure}
        categories={categories}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Detail Modal */}
      <ProcedureDetailModal
        isOpen={Boolean(viewingProcedureId)}
        onClose={() => setViewingProcedureId(null)}
        procedureId={viewingProcedureId}
        procedure={activeViewingProcedure}
        userPermissionCtx={userPermissionCtx}
        onEdit={() => {
          setEditingProcedure(activeViewingProcedure);
          setViewingProcedureId(null);
          setIsEditorOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingProcedure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Delete Procedure?</h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              Are you sure you want to delete procedure <strong>"{deletingProcedure.title}"</strong>?
              It can be restored later by an administrator.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setDeletingProcedure(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
