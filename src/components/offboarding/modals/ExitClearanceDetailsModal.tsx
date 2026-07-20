import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    BriefcaseBusiness,
    CheckCircle2,
    FileSignature,
    Laptop,
    Loader2,
    PackagePlus,
    RotateCcw,
    WalletCards,
    X,
} from "lucide-react";

import {
    useCompleteExitClearanceStep,
    useCompleteExitProcess,
    useDisableExitAccount,
    useExitClearance,
    useUpdateExitFinalPay,
} from "../../../hooks/useOffboarding";

import {
    useExitResources,
    useUpdateExitResourceReturn,
} from "../../../hooks/useExitResources";

import RegisterAcceptedResourceModal from "./RegisterAcceptedResourceModal";

import {
    formatExitDate,
    getExitModeLabel,
    getExitStatusClasses,
    getExitStatusLabel,
} from "../exit.utils";

interface ExitClearanceDetailsModalProps {
    exitProcess: any | null;

    onClose: () => void;

    showAlert: (
        message: string,
        type?: "success" | "error" | "info",
    ) => void;
}

const STEP_ICONS: Record<
    string,
    typeof FileSignature
> = {
    exit_letter_confirmed: FileSignature,

    resignation_letter_signed: FileSignature,

    final_payment_settled: WalletCards,

    assets_credentials_returned: Laptop,

    project_handover_completed:
        BriefcaseBusiness,
};

const COMPLETED_STEP_STATUSES = new Set([
    "completed",
    "waived",
]);

function getErrorMessage(
    error: unknown,
    fallback = "Something went wrong.",
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
        candidate?.response?.data?.message ||
        candidate?.response?.data?.error ||
        candidate?.message ||
        fallback
    );
}

function getEmployeeName(exitProcess: any): string {
    return (
        exitProcess?.employee?.fullName ||
        exitProcess?.employee?.email ||
        "Employee"
    );
}

function getDepartmentName(exitProcess: any): string {
    return (
        exitProcess?.employee?.BusinessUserProfile
            ?.department?.name || "-"
    );
}

function getPositionName(exitProcess: any): string {
    return (
        exitProcess?.employee?.BusinessUserProfile
            ?.position?.title || "-"
    );
}

function numberValue(value: unknown): string {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "";
    }

    return String(value);
}

export default function ExitClearanceDetailsModal({
    exitProcess,
    onClose,
    showAlert,
}: ExitClearanceDetailsModalProps) {
    const exitProcessId =
        exitProcess?.id || "";

    const clearanceQuery =
        useExitClearance(
            exitProcessId || undefined,
        );

    const resourcesQuery =
        useExitResources(
            exitProcessId || undefined,
        );

    const completeStep =
        useCompleteExitClearanceStep();

    const updateResourceReturn =
        useUpdateExitResourceReturn();

    const updateFinalPay =
        useUpdateExitFinalPay();
    const completeExit =
        useCompleteExitProcess();
    const disableAccount =
        useDisableExitAccount();

    const [
        registerResourceOpen,
        setRegisterResourceOpen,
    ] = useState(false);

    const [
        selectedResource,
        setSelectedResource,
    ] = useState<any | null>(null);
    const [
        completionNote,
        setCompletionNote,
    ] = useState("");
    const [
        resourceStatus,
        setResourceStatus,
    ] = useState<
        | "pending"
        | "returned"
        | "damaged"
        | "lost"
        | "waived"
    >("pending");

    const [
        resourceCondition,
        setResourceCondition,
    ] = useState("");

    const [
        resourceNotes,
        setResourceNotes,
    ] = useState("");

    const [
        resourceDeduction,
        setResourceDeduction,
    ] = useState("");

    const [
        grossAmount,
        setGrossAmount,
    ] = useState("");

    const [
        deductions,
        setDeductions,
    ] = useState("");

    const [
        paymentNotes,
        setPaymentNotes,
    ] = useState("");

    const [error, setError] =
        useState("");

    const clearance =
        clearanceQuery.data ||
        exitProcess;

    const resources =
        resourcesQuery.data ??
        clearance?.acceptedResources ??
        [];

    const steps =
        clearance?.clearanceSteps ?? [];

    const completedSteps =
        useMemo(
            () =>
                steps.filter((step: any) =>
                    COMPLETED_STEP_STATUSES.has(
                        String(step.status),
                    ),
                ).length,
            [steps],
        );

    const allRequiredStepsComplete =
        steps.length > 0 &&
        steps
            .filter(
                (step: any) =>
                    step.required !== false,
            )
            .every((step: any) =>
                COMPLETED_STEP_STATUSES.has(
                    String(step.status),
                ),
            );
    const finalPay =
        clearance?.finalPayData ?? {};
    const finalPaymentSettled =
        String(finalPay.status) ===
        "settled";

    const allResourcesProcessed =
        resources.every((resource: any) => {
            const metadata =
                resource.metadata || {};

            const returnStatus = String(
                metadata.returnStatus ||
                resource.returnStatus ||
                "pending",
            );

            return [
                "returned",
                "damaged",
                "lost",
                "waived",
            ].includes(returnStatus);
        });

    const effectiveDateReached = (() => {
        if (!clearance?.effectiveDate) {
            return false;
        }

        const finalDate = new Date(
            clearance.effectiveDate,
        );

        finalDate.setHours(
            23,
            59,
            59,
            999,
        );

        /*
         * Immediate exits can be approved on the
         * effective date without waiting until
         * midnight.
         */
        if (
            clearance.exitMode === "immediate"
        ) {
            const today =
                new Date().toISOString().slice(0, 10);

            const effectiveDay =
                new Date(
                    clearance.effectiveDate,
                )
                    .toISOString()
                    .slice(0, 10);

            return effectiveDay <= today;
        }

        return finalDate.getTime() <=
            Date.now();
    })();

    const canFinalApprove =
        allRequiredStepsComplete &&
        finalPaymentSettled &&
        allResourcesProcessed &&
        effectiveDateReached &&
        ![
            "completed",
            "account_disabled",
        ].includes(
            String(clearance?.status),
        );


    const netAmount =
        Number(grossAmount || 0) -
        Number(deductions || 0);

    useEffect(() => {
        if (!exitProcess) {
            return;
        }

        setGrossAmount(
            numberValue(
                exitProcess.finalPayData
                    ?.grossAmount,
            ),
        );

        setDeductions(
            numberValue(
                exitProcess.finalPayData
                    ?.deductions,
            ),
        );

        setPaymentNotes(
            exitProcess.finalPayData
                ?.notes || "",
        );

        setSelectedResource(null);
        setError("");
    }, [exitProcess]);

    useEffect(() => {
        if (!selectedResource) {
            return;
        }

        const metadata =
            selectedResource.metadata || {};

        setResourceStatus(
            metadata.returnStatus ||
            selectedResource.returnStatus ||
            "pending",
        );

        setResourceCondition(
            metadata.returnCondition ||
            selectedResource.returnCondition ||
            "",
        );

        setResourceNotes(
            metadata.returnNotes ||
            selectedResource.returnNotes ||
            "",
        );

        setResourceDeduction(
            numberValue(
                metadata.deductionAmount ??
                selectedResource.deductionAmount,
            ),
        );
    }, [selectedResource]);

    if (!exitProcess) {
        return null;
    }

    const isBusy =
        completeStep.isPending ||
        updateResourceReturn.isPending ||
        updateFinalPay.isPending ||
        completeExit.isPending ||
        disableAccount.isPending;

    const refresh = async () => {
        await Promise.all([
            clearanceQuery.refetch(),
            resourcesQuery.refetch(),
        ]);
    };

    const handleCompleteStep = async (
        step: any,
    ) => {
        setError("");

        try {
            await completeStep.mutateAsync({
                exitProcessId,
                stepId: step.id,
                notes: step.notes || undefined,
            });

            showAlert(
                `${step.title} completed.`,
                "success",
            );

            await refresh();
        } catch (caughtError) {
            const message =
                getErrorMessage(
                    caughtError,
                    "Failed to complete clearance step.",
                );

            setError(message);

            showAlert(message, "error");
        }
    };

    const handleUpdateResource =
        async () => {
            if (!selectedResource) {
                return;
            }

            setError("");

            try {
                await updateResourceReturn.mutateAsync({
                    exitProcessId,

                    resourceId:
                        selectedResource.id,

                    data: {
                        returnStatus:
                            resourceStatus,

                        returnCondition:
                            resourceCondition.trim() ||
                            undefined,

                        returnNotes:
                            resourceNotes.trim() ||
                            undefined,

                        deductionAmount:
                            resourceDeduction
                                ? Number(
                                    resourceDeduction,
                                )
                                : 0,
                    },
                });

                showAlert(
                    "Resource return updated.",
                    "success",
                );

                setSelectedResource(null);

                await refresh();
            } catch (caughtError) {
                const message =
                    getErrorMessage(
                        caughtError,
                        "Failed to update resource return.",
                    );

                setError(message);

                showAlert(message, "error");
            }
        };

    const handleSavePayment =
        async (
            status:
                | "pending"
                | "processing"
                | "settled",
        ) => {
            setError("");

            try {
                await updateFinalPay.mutateAsync({
                    id: exitProcessId,

                    data: {
                        status,

                        grossAmount:
                            Number(grossAmount || 0),

                        deductions:
                            Number(deductions || 0),

                        netAmount,

                        notes:
                            paymentNotes.trim() ||
                            undefined,
                    },
                });

                showAlert(
                    status === "settled"
                        ? "Final payment settled."
                        : "Final payment updated.",
                    "success",
                );

                await refresh();
            } catch (caughtError) {
                const message =
                    getErrorMessage(
                        caughtError,
                        "Failed to update final payment.",
                    );

                setError(message);

                showAlert(message, "error");
            }
        };
    const handleFinalApproval =
        async () => {
            setError("");

            if (
                !allRequiredStepsComplete
            ) {
                setError(
                    "Complete or waive every required clearance step first.",
                );

                return;
            }

            if (!finalPaymentSettled) {
                setError(
                    "Final payment must be marked as settled first.",
                );

                return;
            }

            if (!allResourcesProcessed) {
                setError(
                    "Every accepted resource must be returned, damaged, lost, or waived.",
                );

                return;
            }

            if (!effectiveDateReached) {
                setError(
                    "Final approval is not available before the employee's final working date.",
                );

                return;
            }

            try {
                await completeExit.mutateAsync({
                    id: exitProcessId,

                    completionNote:
                        completionNote.trim() ||
                        undefined,
                });

                showAlert(
                    "Exit clearance completed and employment terminated.",
                    "success",
                );

                await refresh();
            } catch (caughtError) {
                const message =
                    getErrorMessage(
                        caughtError,
                        "Failed to complete final exit approval.",
                    );

                setError(message);

                showAlert(
                    message,
                    "error",
                );
            }
        };
    const handleDisableAccount =
        async () => {
            setError("");

            try {
                await disableAccount.mutateAsync(
                    exitProcessId,
                );

                showAlert(
                    "Employee account disabled successfully.",
                    "success",
                );

                onClose();
            } catch (caughtError) {
                const message =
                    getErrorMessage(
                        caughtError,
                        "Failed to disable employee account.",
                    );

                setError(message);

                showAlert(message, "error");
            }
        };

    const registeredResourceIds =
        resources.map((resource: any) =>
            String(resource.id),
        );

    return (
        <>
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/50 p-4">
                <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                    <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">
                                Exit Clearance
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                {getEmployeeName(clearance)}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={refresh}
                                disabled={isBusy}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isBusy}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {clearanceQuery.isLoading ? (
                        <div className="flex min-h-80 items-center justify-center gap-2 text-slate-400">
                            <Loader2 className="h-5 w-5 animate-spin" />

                            <span className="text-xs font-bold">
                                Loading clearance details...
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-6 p-6">
                            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">
                                            Employee
                                        </p>

                                        <h3 className="mt-1 text-base font-black text-slate-900">
                                            {getEmployeeName(clearance)}
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {getPositionName(clearance)}
                                            {" · "}
                                            {getDepartmentName(clearance)}
                                        </p>
                                    </div>

                                    <span
                                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getExitStatusClasses(
                                            clearance?.status,
                                        )}`}
                                    >
                                        {getExitStatusLabel(
                                            clearance?.status,
                                        )}
                                    </span>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                                    <InfoItem
                                        label="Exit type"
                                        value={getExitModeLabel(
                                            clearance?.exitMode,
                                        )}
                                    />

                                    <InfoItem
                                        label="Initiated by"
                                        value={
                                            clearance?.initiatedByType ||
                                            "-"
                                        }
                                        capitalize
                                    />

                                    <InfoItem
                                        label="Final day"
                                        value={formatExitDate(
                                            clearance?.effectiveDate,
                                        )}
                                    />

                                    <InfoItem
                                        label="Reason"
                                        value={
                                            clearance?.exitReasonNameSnapshot ||
                                            clearance?.reason ||
                                            "-"
                                        }
                                    />
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900">
                                            Clearance checklist
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {completedSteps} of{" "}
                                            {steps.length} steps completed.
                                        </p>
                                    </div>

                                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">
                                        {steps.length > 0
                                            ? Math.round(
                                                (completedSteps /
                                                    steps.length) *
                                                100,
                                            )
                                            : 0}
                                        %
                                    </span>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {steps.map((step: any) => {
                                        const Icon =
                                            STEP_ICONS[
                                            step.stepKey
                                            ] || CheckCircle2;

                                        const completed =
                                            COMPLETED_STEP_STATUSES.has(
                                                String(step.status),
                                            );

                                        return (
                                            <div
                                                key={step.id}
                                                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div
                                                        className={
                                                            completed
                                                                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                                                                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                                                        }
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">
                                                            {step.title}
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-slate-500">
                                                            {step.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                {completed ? (
                                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
                                                        {step.status}
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCompleteStep(
                                                                step,
                                                            )
                                                        }
                                                        disabled={isBusy}
                                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {completeStep.isPending ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        )}

                                                        Mark complete
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {steps.length === 0 && (
                                        <div className="px-5 py-10 text-center">
                                            <p className="text-sm font-bold text-slate-700">
                                                No clearance steps found
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Seed the required clearance steps for this exit.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900">
                                            Accepted resources
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Resources issued and accepted by the employee.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setRegisterResourceOpen(true)
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700"
                                    >
                                        <PackagePlus className="h-4 w-4" />
                                        Register resource
                                    </button>
                                </div>

                                {resourcesQuery.isLoading ? (
                                    <div className="flex min-h-32 items-center justify-center">
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                    </div>
                                ) : resources.length === 0 ? (
                                    <div className="px-5 py-10 text-center">
                                        <p className="text-sm font-bold text-slate-700">
                                            No accepted resources
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Register an inventory resource the employee received.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {resources.map(
                                            (resource: any) => {
                                                const metadata =
                                                    resource.metadata ||
                                                    {};

                                                const returnStatus =
                                                    metadata.returnStatus ||
                                                    resource.returnStatus ||
                                                    "pending";

                                                return (
                                                    <div
                                                        key={resource.id}
                                                        className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">
                                                                {resource.name}
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {resource.assetTag ||
                                                                    resource.serialNumber ||
                                                                    resource.category ||
                                                                    "Company resource"}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={
                                                                    returnStatus ===
                                                                        "returned"
                                                                        ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700"
                                                                        : returnStatus ===
                                                                            "damaged" ||
                                                                            returnStatus ===
                                                                            "lost"
                                                                            ? "rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase text-rose-700"
                                                                            : "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase text-amber-700"
                                                                }
                                                            >
                                                                {returnStatus}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedResource(
                                                                        resource,
                                                                    )
                                                                }
                                                                className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-black uppercase text-slate-600 transition hover:bg-slate-50"
                                                            >
                                                                Update
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900">
                                        Remaining payment
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Record final salary, deductions, and settlement status.
                                    </p>
                                </div>

                                <div className="mt-5 grid gap-4 md:grid-cols-3">
                                    <AmountInput
                                        label="Gross amount"
                                        value={grossAmount}
                                        onChange={setGrossAmount}
                                    />

                                    <AmountInput
                                        label="Deductions"
                                        value={deductions}
                                        onChange={setDeductions}
                                    />

                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-black uppercase text-slate-500">
                                            Net payable
                                        </label>

                                        <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm font-black text-slate-800">
                                            {netAmount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="mb-1.5 block text-[10px] font-black uppercase text-slate-500">
                                        Payment notes
                                    </label>

                                    <textarea
                                        rows={3}
                                        value={paymentNotes}
                                        onChange={(event) =>
                                            setPaymentNotes(
                                                event.currentTarget.value,
                                            )
                                        }
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                                    />
                                </div>

                                <div className="mt-4 flex flex-wrap justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSavePayment(
                                                "processing",
                                            )
                                        }
                                        disabled={isBusy}
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Save payment
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSavePayment(
                                                "settled",
                                            )
                                        }
                                        disabled={isBusy}
                                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        Mark settled
                                    </button>
                                </div>

                                {finalPay.status && (
                                    <p className="mt-3 text-right text-[10px] font-black uppercase text-slate-400">
                                        Current status:{" "}
                                        {finalPay.status}
                                    </p>
                                )}
                            </section>

                            {selectedResource && (
                                <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900">
                                                Update resource return
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {selectedResource.name}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedResource(null)
                                            }
                                            className="rounded-lg p-2 text-slate-400 hover:bg-white"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-[10px] font-black uppercase text-slate-500">
                                                Return status
                                            </label>

                                            <select
                                                value={resourceStatus}
                                                onChange={(event) =>
                                                    setResourceStatus(
                                                        event.currentTarget
                                                            .value as typeof resourceStatus,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-blue-400"
                                            >
                                                <option value="pending">
                                                    Pending
                                                </option>

                                                <option value="returned">
                                                    Returned
                                                </option>

                                                <option value="damaged">
                                                    Damaged
                                                </option>

                                                <option value="lost">
                                                    Lost
                                                </option>

                                                <option value="waived">
                                                    Waived
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-[10px] font-black uppercase text-slate-500">
                                                Return condition
                                            </label>

                                            <input
                                                type="text"
                                                value={resourceCondition}
                                                onChange={(event) =>
                                                    setResourceCondition(
                                                        event.currentTarget.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-[10px] font-black uppercase text-slate-500">
                                                Deduction amount
                                            </label>

                                            <input
                                                type="number"
                                                min={0}
                                                value={resourceDeduction}
                                                onChange={(event) =>
                                                    setResourceDeduction(
                                                        event.currentTarget.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-[10px] font-black uppercase text-slate-500">
                                                Notes
                                            </label>

                                            <input
                                                type="text"
                                                value={resourceNotes}
                                                onChange={(event) =>
                                                    setResourceNotes(
                                                        event.currentTarget.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={
                                                handleUpdateResource
                                            }
                                            disabled={isBusy}
                                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {updateResourceReturn.isPending && (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            )}

                                            Save resource return
                                        </button>
                                    </div>
                                </section>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                                    <p className="text-xs font-semibold text-rose-700">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900">
                                        Final Approval
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Complete the exit after all clearance requirements have been satisfied.
                                    </p>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                                    <ApprovalRequirement
                                        label="Clearance steps"
                                        complete={
                                            allRequiredStepsComplete
                                        }
                                    />

                                    <ApprovalRequirement
                                        label="Final payment"
                                        complete={
                                            finalPaymentSettled
                                        }
                                    />

                                    <ApprovalRequirement
                                        label="Resources"
                                        complete={
                                            allResourcesProcessed
                                        }
                                    />

                                    <ApprovalRequirement
                                        label="Final date"
                                        complete={
                                            effectiveDateReached
                                        }
                                    />
                                </div>

                                {![
                                    "completed",
                                    "account_disabled",
                                ].includes(
                                    String(clearance?.status),
                                ) && (
                                        <div className="mt-4">
                                            <label className="mb-1.5 block text-[10px] font-black uppercase text-slate-500">
                                                Final approval note
                                            </label>

                                            <textarea
                                                rows={3}
                                                value={completionNote}
                                                onChange={(event) =>
                                                    setCompletionNote(
                                                        event.currentTarget.value,
                                                    )
                                                }
                                                placeholder="Optional final HR note"
                                                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                                            />
                                        </div>
                                    )}

                                <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isBusy}
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Close
                                    </button>

                                    {canFinalApprove && (
                                        <button
                                            type="button"
                                            onClick={
                                                handleFinalApproval
                                            }
                                            disabled={isBusy}
                                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {completeExit.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4" />
                                            )}

                                            Final Approval
                                        </button>
                                    )}

                                    {!canFinalApprove &&
                                        ![
                                            "completed",
                                            "account_disabled",
                                        ].includes(
                                            String(
                                                clearance?.status,
                                            ),
                                        ) && (
                                            <button
                                                type="button"
                                                disabled
                                                className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-xs font-black text-slate-400"
                                            >
                                                Final Approval
                                            </button>
                                        )}

                                    {clearance?.status ===
                                        "completed" &&
                                        !clearance
                                            ?.accountDisabledAt && (
                                            <button
                                                type="button"
                                                onClick={
                                                    handleDisableAccount
                                                }
                                                disabled={isBusy}
                                                className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-rose-700 disabled:opacity-50"
                                            >
                                                {disableAccount.isPending
                                                    ? "Disabling..."
                                                    : "Disable account"}
                                            </button>
                                        )}

                                    {clearance?.status ===
                                        "account_disabled" && (
                                            <span className="rounded-xl border border-slate-300 bg-slate-100 px-5 py-2.5 text-xs font-black text-slate-700">
                                                Exit completed
                                            </span>
                                        )}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>

            <RegisterAcceptedResourceModal
                isOpen={registerResourceOpen}
                exitProcessId={exitProcessId}
                employeeUserId={
                    clearance?.employeeUserId ||
                    exitProcess.employeeUserId
                }
                registeredResourceIds={
                    registeredResourceIds
                }
                onClose={() =>
                    setRegisterResourceOpen(false)
                }
                showAlert={showAlert}
            />
        </>
    );
}

function InfoItem({
    label,
    value,
    capitalize = false,
}: {
    label: string;
    value: string;
    capitalize?: boolean;
}) {
    return (
        <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[9px] font-black uppercase text-slate-400">
                {label}
            </p>

            <p
                className={`mt-1 truncate text-xs font-bold text-slate-800 ${capitalize ? "capitalize" : ""
                    }`}
            >
                {value}
            </p>
        </div>
    );
}
function ApprovalRequirement({
    label,
    complete,
}: {
    label: string;
    complete: boolean;
}) {
    return (
        <div
            className={
                complete
                    ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                    : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
            }
        >
            <div className="flex items-center gap-2">
                {complete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                )}

                <p
                    className={
                        complete
                            ? "text-[10px] font-black uppercase text-emerald-700"
                            : "text-[10px] font-black uppercase text-amber-700"
                    }
                >
                    {label}
                </p>
            </div>

            <p
                className={
                    complete
                        ? "mt-1 text-[10px] font-semibold text-emerald-600"
                        : "mt-1 text-[10px] font-semibold text-amber-600"
                }
            >
                {complete
                    ? "Complete"
                    : "Required"}
            </p>
        </div>
    );
}
function AmountInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase text-slate-500">
                {label}
            </label>

            <input
                type="number"
                min={0}
                value={value}
                onChange={(event) =>
                    onChange(event.currentTarget.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-blue-400"
            />
        </div>
    );
}