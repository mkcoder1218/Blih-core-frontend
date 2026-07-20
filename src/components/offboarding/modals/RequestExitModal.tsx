import {
    AlertCircle,
    Loader2,
    X,
} from "lucide-react";
import ExitRichTextEditor from "../components/ExitRichTextEditor";
import {
    useEffect,
    useMemo,
    useState, type FormEvent
} from "react";

import {
    useSubmitExitRequest,
    type ExitMode,
} from "../../../hooks/useOffboarding";

import { useExitReasons } from "../../../hooks/useExitReasons";

interface RequestExitModalProps {
    isOpen: boolean;

    onClose: () => void;

    showAlert: (
        message: string,
        type?:
            | "success"
            | "error"
            | "info",
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
        "Failed to submit exit request."
    );
}

function addDays(
    days: number,
): string {
    const date = new Date();

    date.setHours(12, 0, 0, 0);

    date.setDate(
        date.getDate() + days,
    );

    return date
        .toISOString()
        .slice(0, 10);
}

function stripHtml(
    html: string,
): string {
    return html
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
}

function modeNoticeDays(
    mode: ExitMode,
    urgentDays: number,
): number {
    if (mode === "immediate") {
        return 0;
    }

    if (
        mode === "standard_notice"
    ) {
        return 30;
    }

    return urgentDays;
}

export default function RequestExitModal({
    isOpen,
    onClose,
    showAlert,
}: RequestExitModalProps) {
    const reasonsQuery =
        useExitReasons({
            initiator: "employee",
            enabled: isOpen,
        });

    const submitExit =
        useSubmitExitRequest();

    const [exitMode, setExitMode] =
        useState<ExitMode>(
            "standard_notice",
        );

    const [
        urgentNoticeDays,
        setUrgentNoticeDays,
    ] = useState(7);

    const [
        exitReasonId,
        setExitReasonId,
    ] = useState("");

    const [
        explanation,
        setExplanation,
    ] = useState("");

    const [
        effectiveDate,
        setEffectiveDate,
    ] = useState(addDays(30));

    const [
        letterHtml,
        setLetterHtml,
    ] = useState("");

    const [
        submitError,
        setSubmitError,
    ] = useState("");

    const reasons =
        reasonsQuery.data ?? [];

    const selectedReason =
        reasons.find(
            (reason) =>
                reason.id === exitReasonId,
        );

    const noticePeriodDays =
        useMemo(
            () =>
                modeNoticeDays(
                    exitMode,
                    urgentNoticeDays,
                ),
            [
                exitMode,
                urgentNoticeDays,
            ],
        );

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setEffectiveDate(
            addDays(noticePeriodDays),
        );
    }, [
        exitMode,
        noticePeriodDays,
        isOpen,
    ]);

    useEffect(() => {
        if (
            !exitReasonId &&
            reasons.length > 0
        ) {
            setExitReasonId(
                reasons[0].id,
            );
        }
    }, [
        exitReasonId,
        reasons,
    ]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const reasonName =
            selectedReason?.name ||
            "[Exit reason]";

        const modeLabel =
            exitMode === "immediate"
                ? "immediate exit"
                : exitMode === "urgent"
                    ? `${noticePeriodDays}-day urgent notice`
                    : "30-day standard notice";

        setLetterHtml(
            [
                "<p>Dear HR Team,</p>",

                `<p>I am formally submitting my resignation request under the <strong>${modeLabel}</strong> process.</p>`,

                `<p>My requested final working date is <strong>${effectiveDate || "[Final working date]"}</strong>.</p>`,

                `<p>Reason: <strong>${reasonName}</strong>.</p>`,

                explanation.trim()
                    ? `<p>Additional explanation: ${explanation.trim()}</p>`
                    : "",

                "<p>I will complete the required project handover, resource return, payment clearance, and other offboarding responsibilities.</p>",

                "<p>Thank you.</p>",
            ].join(""),
        );
    }, [
        effectiveDate,
        exitMode,
        explanation,
        noticePeriodDays,
        selectedReason?.name,
        isOpen,
    ]);

    const reset = () => {
        setExitMode(
            "standard_notice",
        );

        setUrgentNoticeDays(7);
        setExitReasonId("");
        setExplanation("");
        setEffectiveDate(addDays(30));
        setLetterHtml("");
        setSubmitError("");
    };

    const close = () => {
        if (submitExit.isPending) {
            return;
        }

        reset();
        onClose();
    };

    const handleSubmit = async (
        event: FormEvent,
    ) => {
        event.preventDefault();

        setSubmitError("");

        if (!exitReasonId) {
            setSubmitError(
                "Please select an exit reason.",
            );

            return;
        }

        if (
            exitMode === "urgent" &&
            (
                !Number.isInteger(
                    urgentNoticeDays,
                ) ||
                urgentNoticeDays < 1 ||
                urgentNoticeDays > 29
            )
        ) {
            setSubmitError(
                "Urgent notice must be between 1 and 29 days.",
            );

            return;
        }

        if (
            selectedReason
                ?.requiresExplanation &&
            explanation.trim().length < 3
        ) {
            setSubmitError(
                "An explanation is required for the selected reason.",
            );

            return;
        }

        if (
            stripHtml(letterHtml).length <
            10
        ) {
            setSubmitError(
                "Please provide a valid resignation letter.",
            );

            return;
        }

        try {
            await submitExit.mutateAsync({
                exitMode,
                noticePeriodDays,
                effectiveDate,
                exitReasonId,

                reason:
                    explanation.trim() ||
                    undefined,

                letterHtml,
            });

            showAlert(
                "Exit request submitted successfully.",
                "success",
            );

            reset();
            onClose();
        } catch (error) {
            const message =
                getErrorMessage(error);

            setSubmitError(message);

            showAlert(
                message,
                "error",
            );
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">
                            Request Exit
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Submit a permanent employment exit request.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={close}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 p-6"
                >
                    <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-wide text-slate-500">
                            Exit type
                        </label>

                        <div className="grid gap-3 md:grid-cols-3">
                            {[
                                {
                                    value:
                                        "immediate",
                                    title:
                                        "Immediate",
                                    description:
                                        "No notice days",
                                },

                                {
                                    value: "urgent",
                                    title: "Urgent",
                                    description:
                                        "1–29 notice days",
                                },

                                {
                                    value:
                                        "standard_notice",
                                    title:
                                        "Standard Notice",
                                    description:
                                        "Fixed 30 days",
                                },
                            ].map((option) => {
                                const selected =
                                    exitMode ===
                                    option.value;

                                return (
                                    <button
                                        key={
                                            option.value
                                        }
                                        type="button"
                                        onClick={() =>
                                            setExitMode(
                                                option.value as ExitMode,
                                            )
                                        }
                                        className={
                                            selected
                                                ? "rounded-xl border-2 border-blue-500 bg-blue-50 p-4 text-left"
                                                : "rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                                        }
                                    >
                                        <p className="text-xs font-black text-slate-900">
                                            {option.title}
                                        </p>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            {
                                                option.description
                                            }
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {exitMode === "urgent" && (
                        <div>
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">
                                Notice days
                            </label>

                            <input
                                type="number"
                                min={1}
                                max={29}
                                value={
                                    urgentNoticeDays
                                }
                                onChange={(event) =>
                                    setUrgentNoticeDays(
                                        Number(
                                            event
                                                .currentTarget
                                                .value,
                                        ),
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
                            />
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">
                                Exit reason
                            </label>

                            <select
                                value={exitReasonId}
                                onChange={(event) =>
                                    setExitReasonId(
                                        event
                                            .currentTarget
                                            .value,
                                    )
                                }
                                disabled={
                                    reasonsQuery.isLoading
                                }
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
                            >
                                {reasonsQuery.isLoading && (
                                    <option value="">
                                        Loading reasons...
                                    </option>
                                )}

                                {!reasonsQuery.isLoading &&
                                    reasons.length ===
                                    0 && (
                                        <option value="">
                                            No reasons available
                                        </option>
                                    )}

                                {reasons.map(
                                    (reason) => (
                                        <option
                                            key={reason.id}
                                            value={
                                                reason.id
                                            }
                                        >
                                            {reason.name}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">
                                Final working date
                            </label>

                            <input
                                type="date"
                                value={effectiveDate}
                                min={addDays(
                                    noticePeriodDays,
                                )}
                                onChange={(event) =>
                                    setEffectiveDate(
                                        event
                                            .currentTarget
                                            .value,
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">
                            Explanation
                            {selectedReason
                                ?.requiresExplanation
                                ? " *"
                                : ""}
                        </label>

                        <ExitRichTextEditor
                            value={letterHtml}
                            onChange={setLetterHtml}
                            disabled={submitExit.isPending}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">
                            Resignation letter
                        </label>

                        <textarea
                            rows={9}
                            value={stripHtml(
                                letterHtml,
                            )}
                            onChange={(event) =>
                                setLetterHtml(
                                    `<p>${event.currentTarget.value.replace(/\n/g, "</p><p>")}</p>`,
                                )
                            }
                            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
                            required
                        />
                    </div>

                    {submitError && (
                        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                            <p className="text-xs font-semibold text-rose-700">
                                {submitError}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <button
                            type="button"
                            onClick={close}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                submitExit.isPending ||
                                reasons.length === 0
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitExit.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}

                            Submit request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}