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
} from "lucide-react";
import {
  useBrainArticles,
  useBrainCategories,
  useCreateBrainArticle,
  useUpdateBrainArticle,
  useDeleteBrainArticle,
} from "../../../hooks/useBrain";
import { useBrainAuthorization } from "../../../hooks/useBrainAuthorization";
import { useMe } from "../../../hooks/useMe";
import { KnowledgeArticle } from "../../../api/brain";
import { ArticleEditorModal } from "../modal/ArticleEditorModal";
import { ArticleDetailModal } from "../modal/ArticleDetailModal";
import {
  canCreateArticle,
  canEditArticle,
  canDeleteArticle,
} from "../articlePermissions";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface BrainKnowledgeTabProps {
  onNavigateToCategories?: () => void;
}

export function BrainKnowledgeTab({ onNavigateToCategories }: BrainKnowledgeTabProps) {
  const meRes = useMe();
  const meData = meRes.data?.data;
  const currentUser = meData?.user;
  const { brainActions, isSuperAdmin } = useBrainAuthorization();

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

  // Permission flags
  const canView = brainActions.canView || isSuperAdmin;

  // Filter, Sort, & Pagination states
  const [search, setSearch] = useState("");
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"title" | "createdAt" | "updatedAt" | "publishedAt" | "version">("updatedAt");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Editor & Detail Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [viewingArticleId, setViewingArticleId] = useState<string | null>(null);

  // Delete Confirmation Modal state
  const [deletingArticle, setDeletingArticle] = useState<KnowledgeArticle | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Fetch categories for filter dropdown & editor
  const { data: categoryData } = useBrainCategories(
    { page: 1, size: 100, status: "active" },
    { enabled: canView }
  );
  const categories = categoryData?.rows || [];

  // Construct query parameters for Articles API
  const queryParams = useMemo(() => {
    const p: any = {
      page,
      size: pageSize,
      sortBy,
      sortDirection,
    };
    if (search.trim()) p.search = search.trim();
    if (categoryIdFilter !== "all") p.categoryId = categoryIdFilter;
    if (statusFilter !== "all") p.status = statusFilter;
    if (visibilityFilter !== "all") p.visibility = visibilityFilter;
    if (mineOnly) p.mine = true;
    return p;
  }, [page, pageSize, sortBy, sortDirection, search, categoryIdFilter, statusFilter, visibilityFilter, mineOnly]);

  const { data: articleData, isLoading, isError, error, refetch } = useBrainArticles(queryParams, {
    enabled: canView,
  });

  const createMutation = useCreateBrainArticle();
  const updateMutation = useUpdateBrainArticle();
  const deleteMutation = useDeleteBrainArticle();

  const articles = articleData?.rows || [];
  const totalCount = articleData?.count || 0;
  const totalPages = articleData?.pages || 1;

  // Handle Form Submit (Create / Edit)
  const handleEditorSubmit = async (input: any) => {
    if (editingArticle) {
      await updateMutation.mutateAsync({ id: editingArticle.id, input });
    } else {
      await createMutation.mutateAsync(input);
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!deletingArticle) return;
    setDeleteErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(deletingArticle.id);
      setDeletingArticle(null);
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete article.";
      setDeleteErrorMessage(serverMsg);
    }
  };

  // Sort direction toggle helper
  const handleSortToggle = (field: "title" | "createdAt" | "updatedAt" | "publishedAt" | "version") => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(field);
      setSortDirection("DESC");
    }
    setPage(1);
  };

  // Access Denied View
  if (!canView) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-black text-rose-950">Access Restricted</h2>
          <p className="mt-2 text-xs font-medium text-rose-800">
            You do not have permission to view Knowledge Articles.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-100/70 px-3 py-1.5 text-[11px] font-bold text-rose-800">
            <Lock className="h-3.5 w-3.5" />
            Requires permission: <code className="font-mono text-rose-900">brain.article.view</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 antialiased">
      {/* Header Controls Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 z-10" />
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search articles by title, summary, content..."
                className="h-9 w-full sm:w-72 rounded-lg pl-10 pr-3.5 text-xs font-medium text-slate-900 border border-slate-200"
              />
            </div>

            {/* Category Filter */}
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

            {/* Status Filter */}
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

            {/* Visibility Filter */}
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
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToCategories && (
              <button
                type="button"
                onClick={onNavigateToCategories}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FolderTree className="h-4 w-4 text-blue-600" />
                <span>Categories</span>
              </button>
            )}

            {canCreateArticle(userPermissionCtx) && (
              <button
                type="button"
                onClick={() => {
                  setEditingArticle(null);
                  setIsEditorOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Article</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Row: Mine Only Checkbox & Sorting Controls */}
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between text-xs">
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => {
                  setMineOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>My Articles Only</span>
            </label>
          </div>

          {/* Sort By Controls */}
          <div className="flex items-center gap-2 font-medium text-slate-500">
            <span className="text-[11px] font-bold text-slate-400">Sort by:</span>
            {(["updatedAt", "title", "version", "createdAt"] as const).map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => handleSortToggle(field)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition-colors ${
                  sortBy === field
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                {field === "updatedAt" ? "Updated" : field}
                {sortBy === field && (
                  <span className="ml-1 text-[10px]">{sortDirection === "ASC" ? "↑" : "↓"}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-xs font-bold">Loading Knowledge Articles…</p>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-600 mb-2" />
          <h3 className="text-sm font-black text-rose-950">
            {(error as any)?.response?.data?.message || (error as any)?.message || "Failed to load articles"}
          </h3>
          <p className="mt-1 text-xs font-medium text-rose-700">
            {(error as any)?.response?.status === 403
              ? "Backend returned 403 Forbidden. Ensure the 'brain' module is set to active in Business Settings and your role possesses 'brain.access' and 'brain.article.view' permissions."
              : "An error occurred while fetching knowledge articles from the server."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-black text-slate-900">No Knowledge Articles Found</h3>
          <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">
            No articles match your search and filter parameters. Draft a new article to share knowledge.
          </p>
          {canCreateArticle(userPermissionCtx) && (
            <button
              type="button"
              onClick={() => {
                setEditingArticle(null);
                setIsEditorOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create First Article
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 cursor-pointer" onClick={() => handleSortToggle("title")}>
                    <div className="flex items-center gap-1">
                      <span>Title & Summary</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Visibility</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center cursor-pointer" onClick={() => handleSortToggle("version")}>
                    Version
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer" onClick={() => handleSortToggle("updatedAt")}>
                    Updated
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {articles.map((article) => {
                  const editable = canEditArticle(userPermissionCtx, article);
                  const deletable = canDeleteArticle(userPermissionCtx, article);

                  return (
                    <tr key={article.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Title & Summary */}
                      <td className="py-3.5 px-4 cursor-pointer" onClick={() => setViewingArticleId(article.id)}>
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900 block hover:text-blue-600 transition-colors">
                            {article.title}
                          </span>
                          {article.summary && (
                            <p className="text-[11px] text-slate-500 truncate max-w-sm">
                              {article.summary}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        {article.category ? (
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                            {article.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Uncategorized</span>
                        )}
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="text-[11px] font-semibold text-slate-800">
                            {article.author?.fullName || article.author?.email || "System User"}
                          </span>
                        </div>
                      </td>

                      {/* Visibility */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            article.visibility === "company"
                              ? "bg-blue-50 text-blue-700"
                              : article.visibility === "department"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {article.visibility === "company" ? (
                            <Globe className="h-3 w-3" />
                          ) : article.visibility === "department" ? (
                            <Building2 className="h-3 w-3" />
                          ) : (
                            <Lock className="h-3 w-3" />
                          )}
                          {article.visibility}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            article.status === "published"
                              ? "bg-emerald-50 text-emerald-700"
                              : article.status === "approved"
                              ? "bg-blue-50 text-blue-700"
                              : article.status === "in_review"
                              ? "bg-indigo-50 text-indigo-700"
                              : article.status === "changes_requested"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : article.status === "archived"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {article.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Version */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600 text-[11px]">
                        v{article.version}
                      </td>

                      {/* Updated */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {new Date(article.updatedAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingArticleId(article.id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="View Details & Workflow History"
                          >
                            <FileCheck className="h-4 w-4" />
                          </button>

                          {editable && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingArticle(article);
                                setIsEditorOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                              title="Edit Article"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}

                          {deletable && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteErrorMessage(null);
                                setDeletingArticle(article);
                              }}
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                              title="Delete Article"
                            >
                              <Trash2 className="h-4 w-4" />
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

          {/* Mobile Card Stack View */}
          <div className="block md:hidden divide-y divide-slate-100">
            {articles.map((article) => {
              const editable = canEditArticle(userPermissionCtx, article);
              const deletable = canDeleteArticle(userPermissionCtx, article);

              return (
                <div key={article.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">{article.title}</h4>
                      {article.summary && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {article.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingArticle(article);
                          setIsEditorOpen(true);
                        }}
                        className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                        title={editable ? "Edit Article" : "View Article"}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {deletable && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteErrorMessage(null);
                            setDeletingArticle(article);
                          }}
                          className="rounded-lg p-1 text-rose-500 hover:bg-rose-50"
                          title="Delete Article"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                    {article.category && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                        {article.category.name}
                      </span>
                    )}
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 font-bold uppercase text-blue-700">
                      {article.visibility}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold uppercase text-emerald-700">
                      {article.status.replace("_", " ")}
                    </span>
                    <span className="font-mono text-slate-400 font-bold">
                      v{article.version}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
              <span>
                Showing <strong>{articles.length}</strong> of <strong>{totalCount}</strong> articles
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              <span className="text-xs font-bold text-slate-700 px-2">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Article Modal */}
      <ArticleEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSubmit={handleEditorSubmit}
        initialData={editingArticle}
        categories={categories}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      {deletingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">Delete Knowledge Article</h3>
            </div>

            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              Are you sure you want to delete article{" "}
              <strong className="text-slate-900">"{deletingArticle.title}"</strong>?
            </p>

            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-[11px] font-medium text-amber-800 border border-amber-200">
              <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                This article will be soft-deleted and removed from the active knowledge list.
              </span>
            </div>

            {deleteErrorMessage && (
              <div className="mt-3 flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-bold">{deleteErrorMessage}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingArticle(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Detail & Workflow Modal */}
      <ArticleDetailModal
        isOpen={Boolean(viewingArticleId)}
        onClose={() => setViewingArticleId(null)}
        articleId={viewingArticleId}
        userPermissionCtx={userPermissionCtx}
        onEditArticle={(article) => {
          setEditingArticle(article);
          setIsEditorOpen(true);
        }}
      />
    </div>
  );
}
