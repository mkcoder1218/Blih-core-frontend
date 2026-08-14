import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  internalPoliciesApi,
  type InternalPolicySummary,
} from "../../api/internalPolicies";

const PAGE_SIZE = 20;
const EMPTY_POLICIES: InternalPolicySummary[] = [];

function formatDate(value?: string | null) {
  if (!value) return "Not specified";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function titleCase(value?: string | null) {
  if (!value) return "General";

  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function errorMessage(error: unknown) {
  return (
    (error as any)?.response?.data?.message ||
    (error as Error | undefined)?.message ||
    "Something went wrong while loading company policies."
  );
}

function PolicyMeta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-xs font-semibold text-foreground">{value}</div>
    </div>
  );
}

export default function CompanyPolicyLibrary() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search.trim());

  const listQuery = useQuery({
    queryKey: ["company-policy-library", page, deferredSearch],
    queryFn: () =>
      internalPoliciesApi.list({
        page,
        size: PAGE_SIZE,
        search: deferredSearch || undefined,
        sortBy: "publishedAt",
        sortDirection: "DESC",
      }),
  });

  const policies = listQuery.data?.rows || EMPTY_POLICIES;
  const totalPages = Math.max(listQuery.data?.pages || 1, 1);
  const totalPolicies = listQuery.data?.count || 0;

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    if (listQuery.isLoading) return;

    if (policies.length === 0) {
      if (selectedPolicyId !== null) setSelectedPolicyId(null);
      return;
    }

    if (!selectedPolicyId || !policies.some((policy) => policy.id === selectedPolicyId)) {
      setSelectedPolicyId(policies[0].id);
    }
  }, [listQuery.isLoading, policies, selectedPolicyId]);

  const detailQuery = useQuery({
    queryKey: ["company-policy-library", "detail", selectedPolicyId],
    enabled: Boolean(selectedPolicyId),
    queryFn: () => internalPoliciesApi.get(selectedPolicyId as string),
  });

  const selectedSummary = useMemo(
    () => policies.find((policy) => policy.id === selectedPolicyId) || null,
    [policies, selectedPolicyId],
  );

  const selectedPolicy = detailQuery.data || selectedSummary;

  return (
    <div className="space-y-5 text-foreground">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                  Company Policies
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Internal access
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-xs font-medium text-muted-foreground">
                Read the latest published company policies. This library is read-only and available to authenticated employees in your company.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
            <FileText className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Published policies
              </p>
              <p className="text-sm font-extrabold text-foreground">{totalPolicies}</p>
            </div>
          </div>
        </div>

        <div className="grid min-h-[620px] grid-cols-1 xl:grid-cols-[370px_minmax(0,1fr)]">
          <aside className="border-b border-border xl:border-b-0 xl:border-r">
            <div className="border-b border-border p-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search policies..."
                  className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>
            </div>

            <div className="max-h-[560px] overflow-y-auto p-2.5">
              {listQuery.isLoading ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs font-semibold">Loading published policies...</p>
                </div>
              ) : listQuery.isError ? (
                <div className="m-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs font-medium text-destructive">
                  {errorMessage(listQuery.error)}
                </div>
              ) : policies.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h2 className="mt-3 text-sm font-bold text-foreground">
                    {deferredSearch ? "No matching policies" : "No published policies yet"}
                  </h2>
                  <p className="mt-1 max-w-[240px] text-xs leading-5 text-muted-foreground">
                    {deferredSearch
                      ? "Try a different title, policy type, category, or keyword."
                      : "Published company-wide policies will appear here automatically."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {policies.map((policy) => {
                    const active = policy.id === selectedPolicyId;

                    return (
                      <button
                        key={policy.id}
                        type="button"
                        onClick={() => setSelectedPolicyId(policy.id)}
                        className={`w-full rounded-xl border px-3.5 py-3 text-left transition ${
                          active
                            ? "border-primary/30 bg-primary/5 shadow-sm"
                            : "border-transparent hover:border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`truncate text-xs font-extrabold ${active ? "text-primary" : "text-foreground"}`}>
                              {policy.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                              {policy.summary || "Published company policy"}
                            </p>
                          </div>
                          <ChevronRight
                            className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                          />
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-muted px-2 py-1 text-[9px] font-bold text-muted-foreground">
                            {titleCase(policy.policyType)}
                          </span>
                          {policy.category?.name ? (
                            <span className="rounded-md bg-muted px-2 py-1 text-[9px] font-bold text-muted-foreground">
                              {policy.category.name}
                            </span>
                          ) : null}
                          <span className="rounded-md bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary">
                            {policy.versionLabel || `v${policy.version}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={page <= 1}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[10px] font-bold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[10px] font-bold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </aside>

          <main className="min-w-0 bg-background/20">
            {!selectedPolicyId ? (
              <div className="flex min-h-[620px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-base font-extrabold text-foreground">Choose a policy to read</h2>
                <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                  Select any published company policy from the list to view its current approved content.
                </p>
              </div>
            ) : detailQuery.isLoading ? (
              <div className="flex min-h-[620px] flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-xs font-semibold">Opening policy...</p>
              </div>
            ) : detailQuery.isError ? (
              <div className="p-6">
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs font-medium text-destructive">
                  {errorMessage(detailQuery.error)}
                </div>
              </div>
            ) : selectedPolicy ? (
              <article className="mx-auto w-full max-w-5xl p-5 sm:p-7 lg:p-9">
                <div className="border-b border-border pb-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                      {titleCase(selectedPolicy.policyType)}
                    </span>
                    {selectedPolicy.category?.name ? (
                      <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                        {selectedPolicy.category.name}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Published
                    </span>
                  </div>

                  <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                    {selectedPolicy.title}
                  </h2>
                  {selectedPolicy.summary ? (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {selectedPolicy.summary}
                    </p>
                  ) : null}

                  <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <PolicyMeta
                      label="Version"
                      value={selectedPolicy.versionLabel || `v${selectedPolicy.version}`}
                    />
                    <PolicyMeta
                      label="Published"
                      value={formatDate(selectedPolicy.publishedAt)}
                    />
                    <PolicyMeta
                      label="Effective from"
                      value={formatDate(selectedPolicy.effectiveFrom)}
                    />
                    <PolicyMeta
                      label="Effective until"
                      value={formatDate(selectedPolicy.effectiveUntil)}
                    />
                  </div>
                </div>

                <div className="py-7">
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Current published company version
                  </div>

                  {selectedPolicy.contentHtml ? (
                    <div
                      className="max-w-none text-sm leading-7 text-foreground [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_h1]:mb-4 [&_h1]:mt-7 [&_h1]:text-2xl [&_h1]:font-black [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-extrabold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
                      dangerouslySetInnerHTML={{ __html: selectedPolicy.contentHtml }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                      {selectedPolicy.contentText || "This policy does not contain readable content."}
                    </div>
                  )}
                </div>
              </article>
            ) : null}
          </main>
        </div>
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[11px] leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          This is the internal read-only policy library. Draft, archived, private, department-only, and unpublished documents are never exposed here. Policy editing remains in the permission-controlled Policy Management workspace.
        </p>
      </div>
    </div>
  );
}
