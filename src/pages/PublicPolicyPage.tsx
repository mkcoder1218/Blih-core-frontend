import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  FileCheck2,
  FileText,
  Printer,
  ShieldCheck,
} from "lucide-react";

type PublicPolicyPayload = {
  title: string;
  summary?: string | null;
  contentHtml?: string | null;
  policyType?: string | null;
  versionLabel?: string | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  publishedAt?: string | null;
  company?: {
    name?: string | null;
    tagline?: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
  } | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function titleCase(value?: string | null) {
  if (!value) return "Company Policy";
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function resolveToken() {
  const match = window.location.pathname.match(/\/policies\/share\/([^/?#]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export default function PublicPolicyPage() {
  const token = useMemo(resolveToken, []);
  const [policy, setPolicy] = useState<PublicPolicyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) {
        setError("This policy link is invalid.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const base = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
        const response = await fetch(`${base}/api/v1/public/policies/share/${encodeURIComponent(token)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(body?.message || body?.error || (response.status === 410 ? "This policy link has expired." : "This policy link is unavailable."));
        }

        const data = body?.data ?? body;
        if (!data?.title) throw new Error("Policy content is unavailable.");
        if (!cancelled) setPolicy(data);
      } catch (caught: any) {
        if (!cancelled) setError(caught?.message || "Unable to load this policy.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const companyName = policy?.company?.name || "Company Policy";
  const accent = policy?.company?.accentColor || policy?.company?.primaryColor || "#2563eb";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
        <div className="mx-auto max-w-4xl animate-pulse space-y-4">
          <div className="h-8 w-52 rounded bg-slate-200" />
          <div className="h-40 rounded-3xl bg-white shadow-sm" />
          <div className="h-[420px] rounded-3xl bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-xl font-extrabold">Policy link unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{error || "This policy is not available."}</p>
          <p className="mt-5 text-xs text-slate-400">Ask the company that shared this policy with you for a new link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      <div className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: accent }}>
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{companyName}</p>
              <p className="truncate text-xs text-slate-500">{policy.company?.tagline || "Public policy document"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
          <div className="h-1.5" style={{ backgroundColor: accent }} />
          <div className="border-b border-slate-100 px-6 py-7 sm:px-10 sm:py-9">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                Published Policy
              </span>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em]" style={{ backgroundColor: `${accent}12`, color: accent }}>
                {titleCase(policy.policyType)}
              </span>
            </div>

            <h1 className="max-w-4xl text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">{policy.title}</h1>
            {policy.summary ? <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{policy.summary}</p> : null}

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400"><FileCheck2 className="h-3.5 w-3.5" /> Version</p>
                <p className="mt-2 text-sm font-bold text-slate-800">{policy.versionLabel || "Current"}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400"><CalendarDays className="h-3.5 w-3.5" /> Effective From</p>
                <p className="mt-2 text-sm font-bold text-slate-800">{formatDate(policy.effectiveFrom)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400"><CalendarDays className="h-3.5 w-3.5" /> Effective Until</p>
                <p className="mt-2 text-sm font-bold text-slate-800">{formatDate(policy.effectiveUntil)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400"><FileText className="h-3.5 w-3.5" /> Published</p>
                <p className="mt-2 text-sm font-bold text-slate-800">{formatDate(policy.publishedAt)}</p>
              </div>
            </div>
          </div>

          <article
            className="policy-public-content px-6 py-8 text-[15px] leading-7 text-slate-700 sm:px-10 sm:py-10 [&_a]:font-semibold [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-slate-950 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-slate-950 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 [&_li]:my-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_strong]:font-extrabold [&_strong]:text-slate-900 [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-2.5 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:p-2.5 [&_th]:text-left [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: policy.contentHtml || "<p>No policy content is available.</p>" }}
          />

          <footer className="border-t border-slate-100 bg-slate-50 px-6 py-5 sm:px-10">
            <p className="text-xs leading-5 text-slate-500">
              This is the published version shared by <strong className="font-bold text-slate-700">{companyName}</strong>. If you received this link from the company, use this page as the current shared reference.
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}
