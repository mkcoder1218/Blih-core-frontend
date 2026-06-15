import { Check, ShieldCheck, X } from "lucide-react";
import { useApproveDevice, useEmployeeDevices, useRejectDevice } from "../../hooks/useDevices";
import { useMyPermissions } from "../../hooks/usePermissions";

function formatDate(value?: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function statusClass(status: string) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-rose-50 text-rose-700 border-rose-100";
}

export default function EmployeeDevicesTab({ showAlert }: { showAlert: (title: string, type?: "success" | "info" | "error") => void }) {
  const { data, isLoading, error } = useEmployeeDevices();
  const approve = useApproveDevice();
  const reject = useRejectDevice();
  const permissions = useMyPermissions();
  const canApprove = permissions.can("device.approve");
  const devices = data?.devices ?? [];

  const approveDevice = async (id: string) => {
    try {
      await approve.mutateAsync(id);
      showAlert("Device approved", "success");
    } catch (e: any) {
      showAlert(e?.response?.data?.message || "Could not approve device", "error");
    }
  };

  const rejectDevice = async (id: string) => {
    try {
      await reject.mutateAsync(id);
      showAlert("Device rejected", "success");
    } catch (e: any) {
      showAlert(e?.response?.data?.message || "Could not reject device", "error");
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-950">Employee Devices</h3>
          <p className="text-xs font-medium text-slate-500">Approved and pending devices used by employees.</p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{devices.length} devices</div>
      </div>

      {isLoading && <div className="rounded-lg border border-slate-100 p-4 text-sm font-semibold text-slate-500">Loading devices...</div>}
      {error && <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">Could not load devices.</div>}

      {!isLoading && !error && devices.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500">
          No registered devices yet.
        </div>
      )}

      {devices.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wide text-slate-400">
                <th className="py-3 pr-4">Employee</th>
                <th className="py-3 pr-4">Device</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Last seen</th>
                <th className="py-3 pr-4">Created</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="font-black text-slate-950">{device.user?.fullName || "Employee"}</div>
                    <div className="text-xs font-medium text-slate-500">{device.user?.email}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      {device.label}
                    </div>
                    <div className="mt-1 max-w-md truncate text-xs text-slate-400">{device.userAgent || "No browser details"}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full border px-2 py-1 text-xs font-black capitalize ${statusClass(device.status)}`}>{device.status}</span>
                  </td>
                  <td className="py-3 pr-4 text-xs font-semibold text-slate-500">{formatDate(device.lastSeenAt)}</td>
                  <td className="py-3 pr-4 text-xs font-semibold text-slate-500">{formatDate(device.createdAt)}</td>
                  <td className="py-3 text-right">
                    {canApprove && device.status === "pending" ? (
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => approveDevice(device.id)}
                          disabled={approve.isPending || reject.isPending}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white disabled:bg-slate-200"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectDevice(device.id)}
                          disabled={approve.isPending || reject.isPending}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-rose-600 px-3 text-xs font-black text-white disabled:bg-slate-200"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">No action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
