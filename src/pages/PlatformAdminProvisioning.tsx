import React, { useMemo, useState } from "react";
import { useBusinesses } from "../hooks/useBusinesses";
import { useCreateBusiness } from "../hooks/useCreateBusiness";
import { useCreateBusinessAdmin } from "../hooks/useCreateBusinessAdmin";

export default function PlatformAdminProvisioning() {
  const businesses = useBusinesses();
  const createBusiness = useCreateBusiness();

  const [bizName, setBizName] = useState("");
  const [bizSlug, setBizSlug] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [planId, setPlanId] = useState("");

  const bizList = businesses.data?.data?.businesses || [];
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

  const createAdmin = useCreateBusinessAdmin(selectedBusinessId || "missing");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const errors = useMemo(() => {
    const e1: any = createBusiness.error;
    const e2: any = createAdmin.error;
    return {
      createBusiness: e1?.response?.data?.message || e1?.message || "",
      createAdmin: e2?.response?.data?.message || e2?.message || "",
    };
  }, [createBusiness.error, createAdmin.error]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="text-sm font-bold text-slate-900">Platform Super Admin</div>
        <div className="text-xs text-slate-600 mt-1">Create businesses and their first Business Admin.</div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="text-sm font-bold text-slate-900">Create Business</div>
        {errors.createBusiness ? (
          <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{errors.createBusiness}</div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={bizName} onChange={(e) => setBizName(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Name" />
          <input value={bizSlug} onChange={(e) => setBizSlug(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Slug (lowercase)" />
          <input value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Email" />
          <input value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Phone" />
          <input value={planId} onChange={(e) => setPlanId(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm sm:col-span-2" placeholder="Plan ID (UUID)" />
        </div>

        <button
          disabled={createBusiness.isPending}
          onClick={() => createBusiness.mutate({ name: bizName, slug: bizSlug, email: bizEmail, phone: bizPhone, planId })}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold py-2 px-3 rounded-xl"
        >
          {createBusiness.isPending ? "Creating..." : "Create Business"}
        </button>

        {createBusiness.data?.success ? (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            {createBusiness.data.message}
          </div>
        ) : null}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-bold text-slate-900">Businesses</div>
          <button
            onClick={() => businesses.refetch()}
            disabled={businesses.isFetching}
            className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl"
          >
            {businesses.isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        {businesses.isLoading ? <div className="text-xs text-slate-600">Loading...</div> : null}
        {businesses.isError ? (
          <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
            {(businesses.error as any)?.response?.data?.message || (businesses.error as any)?.message || "Failed"}
          </div>
        ) : null}

        <div className="text-xs text-slate-600">Select a business to create its first admin user:</div>
        <select
          value={selectedBusinessId}
          onChange={(e) => setSelectedBusinessId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Select business...</option>
          {bizList.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.slug})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="text-sm font-bold text-slate-900">Create Business Admin</div>
        {errors.createAdmin ? (
          <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">{errors.createAdmin}</div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Full name" />
          <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Email" />
          <input value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Phone (optional)" />
          <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Password" />
        </div>

        <button
          disabled={createAdmin.isPending || !selectedBusinessId}
          onClick={() =>
            createAdmin.mutate({ fullName: adminName, email: adminEmail, phone: adminPhone || null, password: adminPassword })
          }
          className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold py-2 px-3 rounded-xl"
        >
          {createAdmin.isPending ? "Creating..." : "Create Admin"}
        </button>

        {createAdmin.data?.success ? (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            {createAdmin.data.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}

