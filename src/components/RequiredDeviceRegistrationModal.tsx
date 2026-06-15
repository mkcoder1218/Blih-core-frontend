import { useMemo, useState } from "react";
import { getDeviceKey, getDeviceLabel, getDeviceUserAgent } from "../lib/deviceIdentity";
import { useMyDevices, useRegisterMyDevice } from "../hooks/useDevices";
import { useMe } from "../hooks/useMe";

export default function RequiredDeviceRegistrationModal() {
  const me = useMe();
  const devicesQuery = useMyDevices();
  const register = useRegisterMyDevice();
  const deviceKey = useMemo(() => getDeviceKey(), []);
  const defaultLabel = useMemo(() => getDeviceLabel(), []);
  const [label, setLabel] = useState(defaultLabel);

  const currentDevice = devicesQuery.data?.devices?.find((device) => device.deviceKey === deviceKey);
  const hasUser = Boolean(me.data?.data?.user);
  const loading = me.isLoading || devicesQuery.isLoading;

  if (!hasUser || loading || currentDevice?.status === "approved") return null;

  const isPending = currentDevice?.status === "pending";
  const isRejected = currentDevice?.status === "rejected";

  const submit = async () => {
    await register.mutateAsync({
      deviceKey,
      label,
      userAgent: getDeviceUserAgent(),
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-950">Register This Device As Mine</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Every employee must register at least one device. Your first two devices are approved automatically; extra devices need admin approval.
          </p>
        </div>

        <div className="mt-4">
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Device name</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isPending}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
              autoFocus
            />
          </label>
        </div>

        {isPending && (
          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
            This device is waiting for approval. You can continue after an admin approves it.
          </div>
        )}

        {isRejected && (
          <div className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            This device was rejected. Ask an admin to review it or register from an approved device.
          </div>
        )}

        {register.error && (
          <div className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            {(register.error as any)?.response?.data?.message || "Could not register this device."}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={register.isPending || isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
          >
            {register.isPending ? "Registering..." : isRejected ? "Register Again" : "Register Device"}
          </button>
        </div>
      </div>
    </div>
  );
}
