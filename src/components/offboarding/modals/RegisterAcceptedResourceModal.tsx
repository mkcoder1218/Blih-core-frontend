import {
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    AlertCircle,
    Loader2,
    PackagePlus,
    X,
} from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    useInventory,
} from "../../../hooks/useInventory";

import {
    useRegisterExitResource,
} from "../../../hooks/useExitResources";

interface RegisterAcceptedResourceModalProps {
  isOpen: boolean;
  exitProcessId: string;
  employeeUserId: string;
  registeredResourceIds: string[];

  onClose: () => void;

  showAlert: (
    message: string,
    type?: "success" | "error" | "info",
  ) => void;
}

function getErrorMessage(
  error: unknown,
): string {
  const candidate = error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
      };
    };

    message?: string;
  };

  return (
    candidate?.response?.data
      ?.message ||
    candidate?.response?.data
      ?.error ||
    candidate?.message ||
    "Failed to register resource."
  );
}

export default function RegisterAcceptedResourceModal({
  isOpen,
  exitProcessId,
  employeeUserId,
  registeredResourceIds,
  onClose,
  showAlert,
}: RegisterAcceptedResourceModalProps) {
  const inventoryQuery =
    useInventory();

  const registerResource =
    useRegisterExitResource();

  const [
    inventoryItemId,
    setInventoryItemId,
  ] = useState("");

  const [submitError, setSubmitError] =
    useState("");

  const availableItems =
    useMemo(() => {
      const excluded = new Set(
        registeredResourceIds,
      );

      return (
        inventoryQuery.data ?? []
      ).filter((item: any) => {
        if (excluded.has(item.id)) {
          return false;
        }

        const assignedToUserId =
          item.assignedToUserId;

        return (
          !assignedToUserId ||
          String(
            assignedToUserId,
          ) ===
            String(employeeUserId)
        );
      });
    }, [
      inventoryQuery.data,
      registeredResourceIds,
      employeeUserId,
    ]);

  const handleSubmit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setSubmitError("");

    if (!inventoryItemId) {
      setSubmitError(
        "Select a resource.",
      );

      return;
    }

    try {
      await registerResource.mutateAsync({
        exitProcessId,
        inventoryItemId,
      });

      showAlert(
        "Accepted resource registered.",
        "success",
      );

      setInventoryItemId("");
      onClose();
    } catch (error) {
      const message =
        getErrorMessage(error);

      setSubmitError(message);
      showAlert(message, "error");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Register Accepted Resource
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Link an inventory item the employee received or accepted.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={
              registerResource.isPending
            }
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase text-slate-500">
              Inventory resource
            </label>

            <Select
              value={inventoryItemId}
              onValueChange={(value) =>
                setInventoryItemId(
                  String(value || ""),
                )
              }
            >
              <SelectTrigger className="h-11 w-full rounded-xl bg-slate-50 px-3">
                <SelectValue placeholder="Select an inventory item" />
              </SelectTrigger>

              <SelectContent
                align="start"
                className="max-h-72"
              >
                {availableItems.map(
                  (item: any) => (
                    <SelectItem
                      key={item.id}
                      value={item.id}
                      className="py-2.5"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">
                          {item.name}
                        </span>

                        <span className="text-[10px] text-slate-500">
                          {item.assetTag ||
                            item.serialNumber ||
                            item.category}
                        </span>
                      </div>
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>

            {!inventoryQuery.isLoading &&
              availableItems.length ===
                0 && (
                <p className="mt-2 text-xs text-slate-500">
                  No available inventory items. Add the item in Inventory first.
                </p>
              )}
          </div>

          {submitError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-rose-600" />

              <p className="text-xs font-semibold text-rose-700">
                {submitError}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                registerResource.isPending ||
                !inventoryItemId
              }
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white disabled:opacity-50"
            >
              {registerResource.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PackagePlus className="h-4 w-4" />
              )}

              Register resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}