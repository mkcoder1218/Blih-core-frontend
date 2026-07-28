import React, { useState, useMemo } from "react";
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Lock,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  usePolicyCategories,
  useCreatePolicyCategory,
  useUpdatePolicyCategory,
  useDeletePolicyCategory,
  useRestorePolicyCategory,
} from "../../../hooks/usePolicies";
import { useBrainAuthorization } from "../../../hooks/useBrainAuthorization";
import { useMe } from "../../../hooks/useMe";
import { PolicyCategory } from "../../../api/policies";
import { PolicyCategoryFormModal } from "../modal/PolicyCategoryFormModal";
import {
  canCreatePolicyCategory,
  canEditPolicyCategory,
  canDeletePolicyCategory,
  canRestorePolicyCategory,
} from "../policyPermissions";

export function PolicyCategoriesTab() {
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

  const canView = policyActions.canView || isSuperAdmin;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PolicyCategory | null>(null);

  const [deletingCategory, setDeletingCategory] = useState<PolicyCategory | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const p: any = {
      page,
      size: pageSize,
      includeArchived: true,
    };
    if (search.trim()) p.search = search.trim();
    if (statusFilter !== "all") p.status = statusFilter;
    return p;
  }, [page, pageSize, search, statusFilter]);

  const { data: categoryData, isLoading, isError, error, refetch } = usePolicyCategories(queryParams, {
    enabled: canView,
  });

  const createMut = useCreatePolicyCategory();
  const updateMut = useUpdatePolicyCategory();
  const deleteMut = useDeletePolicyCategory();
  const restoreMut = useRestorePolicyCategory();

  const categories = categoryData?.rows || [];
  const totalCount = categoryData?.count || 0;
  const totalPages = categoryData?.pages || 1;

  const handleFormSubmit = async (input: any) => {
    if (editingCategory) {
      await updateMut.mutateAsync({ id: editingCategory.id, input });
    } else {
      await createMut.mutateAsync(input);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    setDeleteErrorMessage(null);
    try {
      await deleteMut.mutateAsync(deletingCategory.id);
      setDeletingCategory(null);
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message || err?.message || "Failed to delete policy category.";
      setDeleteErrorMessage(serverMsg);
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
            You do not have permission to view Policy Categories.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-100/70 px-3 py-1.5 text-[11px] font-bold text-rose-800">
            <Lock className="h-3.5 w-3.5" />
            Requires permission: <code className="font-mono text-rose-900">policy.category.view</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 flex-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search policy categories..."
                className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="archived">Archived Only</option>
              </select>
            </div>
          </div>

          {canCreatePolicyCategory(userPermissionCtx) && (
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Create Policy Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Table */}
      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-xs font-bold">Loading Policy Categories…</p>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-600 mb-2" />
          <h3 className="text-sm font-black text-rose-950">
            {(error as any)?.response?.data?.message || (error as any)?.message || "Failed to load categories"}
          </h3>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FolderTree className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-black text-slate-900">No Policy Categories Found</h3>
          <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">
            Create categories to group policy documentation cleanly.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Category Name</th>
                  <th className="py-3.5 px-4">Parent Category</th>
                  <th className="py-3.5 px-4">Key</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {cat.name}
                      {cat.description && (
                        <p className="text-[11px] text-slate-500 font-normal truncate max-w-xs">
                          {cat.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {cat.parentCategory ? (
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          {cat.parentCategory.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Top-Level</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{cat.key}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          cat.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      {new Date(cat.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEditPolicyCategory(userPermissionCtx) && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat);
                              setIsModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {cat.deletedAt && canRestorePolicyCategory(userPermissionCtx) && (
                          <button
                            type="button"
                            onClick={() => restoreMut.mutate(cat.id)}
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Restore Category"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}

                        {!cat.deletedAt && canDeletePolicyCategory(userPermissionCtx) && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteErrorMessage(null);
                              setDeletingCategory(cat);
                            }}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-medium text-slate-500">
              Showing <strong>{categories.length}</strong> of <strong>{totalCount}</strong> categories
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <PolicyCategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingCategory}
        availableCategories={categories}
        isSubmitting={createMut.isPending || updateMut.isPending}
      />

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-3">
            <h3 className="text-base font-black text-slate-900">Delete Policy Category</h3>
            <p className="text-xs text-slate-600 font-medium">
              Are you sure you want to delete category <strong>"{deletingCategory.name}"</strong>?
            </p>

            {deleteErrorMessage && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 font-bold">
                {deleteErrorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMut.isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleteMut.isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
