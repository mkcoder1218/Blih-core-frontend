import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eraser,
  FileSignature,
  Loader2,
  PenLine,
  Printer,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  useEmploymentContract,
} from "../../hooks/useEmploymentContracts";

import {
  useSignEmploymentContractAsEmployer,
} from "../../hooks/useEmploymentContractSignatures";

interface EmployeeSignatureMetadata {
  signatureDataUrl?: string;

  signerUserId?: string;

  signerEmployeeRecordId?: string;

  signerName?: string;

  signerEmail?: string;

  signedAt?: string;

  ipAddress?: string;

  userAgent?: string;

  consent?: boolean;
}

interface EmployerSignatureMetadata {
  signatureDataUrl?: string;

  signerUserId?: string;

  signerName?: string;

  signerEmail?: string;

  signerRoles?: string[];

  signedAt?: string;

  ipAddress?: string;

  userAgent?: string;

  consent?: boolean;
}

interface EmployeeContractViewerModalProps {
  isOpen: boolean;

  contractId?: string | null;

  onClose: () => void;
}

function getErrorMessage(
  error: unknown,
  fallback =
    "Something went wrong",
): string {
  if (
    typeof error ===
      "object" &&
    error !== null
  ) {
    const candidate =
      error as {
        response?: {
          data?: {
            message?: string;

            error?: {
              message?: string;
            };
          };
        };

        message?: string;
      };

    return (
      candidate.response?.data
        ?.message ||
      candidate.response?.data
        ?.error?.message ||
      candidate.message ||
      fallback
    );
  }

  return fallback;
}

function formatDateTime(
  value?: string | null,
): string {
  if (!value) {
    return "Pending";
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  ).format(
    date,
  );
}

function formatStatus(
  status?: string,
): string {
  return String(
    status ||
      "Unknown",
  )
    .replace(
      /_/g,
      " ",
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character.toUpperCase(),
    );
}

function getStatusClasses(
  status?: string,
): string {
  switch (
    status
  ) {
    case "SIGNED":
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PARTIALLY_SIGNED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "SENT":
    case "VIEWED":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "TERMINATED":
    case "CANCELLED":
    case "EXPIRED":
      return "border-rose-200 bg-rose-50 text-rose-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function readMetadataObject<T>(
  metadata:
    | Record<
        string,
        unknown
      >
    | undefined,
  key: string,
): T | null {
  const value =
    metadata?.[
      key
    ];

  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return null;
  }

  return value as T;
}

function SignatureCanvas({
  disabled = false,
  onChange,
}: {
  disabled?: boolean;

  onChange: (
    value: string,
  ) => void;
}) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null,
    );

  const drawingRef =
    useRef(
      false,
    );

  const [
    hasSignature,
    setHasSignature,
  ] =
    useState(
      false,
    );

  const configureCanvas =
    () => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      const parent =
        canvas.parentElement;

      if (!parent) {
        return;
      }

      const ratio =
        Math.max(
          window.devicePixelRatio ||
            1,
          1,
        );

      const width =
        Math.max(
          parent.clientWidth,
          280,
        );

      const height =
        180;

      canvas.width =
        width *
        ratio;

      canvas.height =
        height *
        ratio;

      canvas.style.width =
        `${width}px`;

      canvas.style.height =
        `${height}px`;

      const context =
        canvas.getContext(
          "2d",
        );

      if (!context) {
        return;
      }

      context.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0,
      );

      context.fillStyle =
        "#ffffff";

      context.fillRect(
        0,
        0,
        width,
        height,
      );

      context.lineCap =
        "round";

      context.lineJoin =
        "round";

      context.lineWidth =
        2.25;

      context.strokeStyle =
        "#0f172a";

      drawingRef.current =
        false;

      setHasSignature(
        false,
      );

      onChange(
        "",
      );
    };

  useEffect(() => {
    configureCanvas();

    const handleResize =
      () => {
        configureCanvas();
      };

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, []);

  const getPoint =
    (
      event:
        ReactPointerEvent<HTMLCanvasElement>,
    ) => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return {
          x: 0,
          y: 0,
        };
      }

      const rect =
        canvas.getBoundingClientRect();

      return {
        x:
          event.clientX -
          rect.left,

        y:
          event.clientY -
          rect.top,
      };
    };

  const handlePointerDown =
    (
      event:
        ReactPointerEvent<HTMLCanvasElement>,
    ) => {
      if (
        disabled
      ) {
        return;
      }

      const canvas =
        canvasRef.current;

      const context =
        canvas?.getContext(
          "2d",
        );

      if (
        !canvas ||
        !context
      ) {
        return;
      }

      canvas.setPointerCapture(
        event.pointerId,
      );

      drawingRef.current =
        true;

      const point =
        getPoint(
          event,
        );

      context.beginPath();

      context.moveTo(
        point.x,
        point.y,
      );
    };

  const handlePointerMove =
    (
      event:
        ReactPointerEvent<HTMLCanvasElement>,
    ) => {
      if (
        disabled ||
        !drawingRef.current
      ) {
        return;
      }

      const canvas =
        canvasRef.current;

      const context =
        canvas?.getContext(
          "2d",
        );

      if (
        !canvas ||
        !context
      ) {
        return;
      }

      const point =
        getPoint(
          event,
        );

      context.lineTo(
        point.x,
        point.y,
      );

      context.stroke();

      setHasSignature(
        true,
      );
    };

  const handlePointerEnd =
    (
      event:
        ReactPointerEvent<HTMLCanvasElement>,
    ) => {
      const canvas =
        canvasRef.current;

      if (
        canvas?.hasPointerCapture(
          event.pointerId,
        )
      ) {
        canvas.releasePointerCapture(
          event.pointerId,
        );
      }

      if (
        !drawingRef.current
      ) {
        return;
      }

      drawingRef.current =
        false;

      if (
        canvas
      ) {
        onChange(
          canvas.toDataURL(
            "image/png",
          ),
        );
      }
    };

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <canvas
          ref={
            canvasRef
          }
          onPointerDown={
            handlePointerDown
          }
          onPointerMove={
            handlePointerMove
          }
          onPointerUp={
            handlePointerEnd
          }
          onPointerCancel={
            handlePointerEnd
          }
          onPointerLeave={(
            event,
          ) => {
            if (
              drawingRef.current
            ) {
              handlePointerEnd(
                event,
              );
            }
          }}
          className={[
            "block w-full touch-none bg-white",

            disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-crosshair",
          ].join(
            " ",
          )}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium text-slate-500">
          Draw the authorized employer signature.
        </p>

        <button
          type="button"
          disabled={
            disabled
          }
          onClick={
            configureCanvas
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Eraser className="h-3.5 w-3.5" />

          Clear
        </button>
      </div>

      {hasSignature ? (
        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />

          Signature captured
        </div>
      ) : null}
    </div>
  );
}

function SignatureCard({
  title,
  description,
  signature,
  signedAt,
  pendingMessage,
}: {
  title: string;

  description: string;

  signature:
    | EmployeeSignatureMetadata
    | EmployerSignatureMetadata
    | null;

  signedAt?: string | null;

  pendingMessage: string;
}) {
  const signatureImage =
    signature?.signatureDataUrl;

  const signatureDate =
    signature?.signedAt ||
    signedAt;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl",

            signatureDate
              ? "bg-emerald-50 text-emerald-600"
              : "bg-amber-50 text-amber-600",
          ].join(
            " ",
          )}
        >
          {signatureDate ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Clock3 className="h-5 w-5" />
          )}
        </div>

        <div>
          <h3 className="text-sm font-black text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-[11px] font-medium text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {signatureImage ? (
        <>
          <div className="mt-5 flex min-h-[170px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <img
              src={
                signatureImage
              }
              alt={
                title
              }
              className="max-h-36 max-w-full object-contain"
            />
          </div>

          <div className="mt-4 space-y-2">
            {"signerName" in signature &&
            signature.signerName ? (
              <div className="flex items-start gap-2 text-[11px] font-semibold text-slate-500">
                <UserRound className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />

                <span>
                  Signed by:{" "}
                  <strong className="text-slate-700">
                    {
                      signature.signerName
                    }
                  </strong>
                </span>
              </div>
            ) : null}

            <div className="flex items-start gap-2 text-[11px] font-semibold text-slate-500">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />

              <span>
                Signed at:{" "}
                <strong className="text-slate-700">
                  {formatDateTime(
                    signatureDate,
                  )}
                </strong>
              </span>
            </div>

            <div className="flex items-start gap-2 text-[11px] font-semibold text-slate-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />

              <span>
                IP address:{" "}
                <strong className="text-slate-700">
                  {signature.ipAddress ||
                    "Not recorded"}
                </strong>
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-black text-amber-800">
            Signature pending
          </p>

          <p className="mt-1 text-[11px] font-medium leading-5 text-amber-700">
            {pendingMessage}
          </p>
        </div>
      )}
    </section>
  );
}

export default function EmployeeContractViewerModal({
  isOpen,
  contractId,
  onClose,
}: EmployeeContractViewerModalProps) {
  const contractQuery =
    useEmploymentContract(
      isOpen
        ? contractId
        : null,
    );

  const signMutation =
    useSignEmploymentContractAsEmployer();

  const [
    employerSignatureDataUrl,
    setEmployerSignatureDataUrl,
  ] =
    useState(
      "",
    );

  const [
    employerConsent,
    setEmployerConsent,
  ] =
    useState(
      false,
    );

  const [
    signingError,
    setSigningError,
  ] =
    useState(
      "",
    );

  useEffect(() => {
    if (
      !isOpen
    ) {
      setEmployerSignatureDataUrl(
        "",
      );

      setEmployerConsent(
        false,
      );

      setSigningError(
        "",
      );
    }
  }, [
    isOpen,
  ]);

  if (!isOpen) {
    return null;
  }

  const contract =
    contractQuery.data;

  const employeeSignature =
    readMetadataObject<EmployeeSignatureMetadata>(
      contract?.metadata,
      "employeeSignature",
    );

  const employerSignature =
    readMetadataObject<EmployerSignatureMetadata>(
      contract?.metadata,
      "employerSignature",
    );

  const employeeSigned =
    Boolean(
      contract?.employeeSignedAt ||
      employeeSignature?.signedAt,
    );

  const employerSigned =
    Boolean(
      contract?.employerSignedAt ||
      employerSignature?.signedAt,
    );

  const renderedHtml =
    contract?.renderedHtml ||
    contract?.bodyHtml ||
    "";

  const canEmployerSign =
    Boolean(
      contract &&
      employeeSigned &&
      !employerSigned &&
      [
        "SENT",
        "VIEWED",
        "PARTIALLY_SIGNED",
      ].includes(
        contract.status,
      ),
    );

  const handleEmployerSign =
    async () => {
      if (
        !contract
      ) {
        return;
      }

      setSigningError(
        "",
      );

      if (
        !employeeSigned
      ) {
        setSigningError(
          "The employee must sign the contract first.",
        );

        return;
      }

      if (
        !employerSignatureDataUrl
      ) {
        setSigningError(
          "Draw the employer signature before continuing.",
        );

        return;
      }

      if (
        !employerConsent
      ) {
        setSigningError(
          "Confirm that you reviewed and approved the contract.",
        );

        return;
      }

      try {
        await signMutation.mutateAsync({
          contractId:
            contract.id,

          input: {
            consent:
              true,

            signatureDataUrl:
              employerSignatureDataUrl,
          },
        });

        setEmployerSignatureDataUrl(
          "",
        );

        setEmployerConsent(
          false,
        );

        await contractQuery.refetch();
      } catch (
        error
      ) {
        setSigningError(
          getErrorMessage(
            error,
            "Failed to countersign the employment contract",
          ),
        );
      }
    };

  const handlePrint =
    () => {
      if (
        !contract
      ) {
        return;
      }

      const printWindow =
        window.open(
          "",
          "_blank",
          "width=1000,height=800",
        );

      if (
        !printWindow
      ) {
        return;
      }

      const employeeSignatureHtml =
        employeeSignature?.signatureDataUrl
          ? `
            <section class="signature-block">
              <h3>Employee Signature</h3>
              <img src="${employeeSignature.signatureDataUrl}" alt="Employee signature" />
              <p>Signed at: ${formatDateTime(
                employeeSignature.signedAt ||
                  contract.employeeSignedAt,
              )}</p>
            </section>
          `
          : `
            <section class="signature-block">
              <h3>Employee Signature</h3>
              <p>Pending</p>
            </section>
          `;

      const employerSignatureHtml =
        employerSignature?.signatureDataUrl
          ? `
            <section class="signature-block">
              <h3>Employer Signature</h3>
              <img src="${employerSignature.signatureDataUrl}" alt="Employer signature" />
              <p>Signed by: ${employerSignature.signerName || "Authorized employer representative"}</p>
              <p>Signed at: ${formatDateTime(
                employerSignature.signedAt ||
                  contract.employerSignedAt,
              )}</p>
            </section>
          `
          : `
            <section class="signature-block">
              <h3>Employer Signature</h3>
              <p>Pending</p>
            </section>
          `;

      printWindow.document.write(`
        <!doctype html>
        <html lang="en" dir="ltr">
          <head>
            <meta charset="utf-8" />

            <title>${contract.subject}</title>

            <style>
              html,
              body {
                direction: ltr !important;
                text-align: left !important;
              }

              body {
                margin: 0;
                padding: 48px;
                font-family: Arial, sans-serif;
                color: #0f172a;
                line-height: 1.7;
              }

              .document,
              .document * {
                direction: ltr !important;
                text-align: left !important;
              }

              .signature-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-top: 48px;
              }

              .signature-block {
                border-top: 1px solid #cbd5e1;
                padding-top: 20px;
              }

              .signature-block img {
                display: block;
                max-width: 320px;
                max-height: 140px;
                object-fit: contain;
              }

              .signature-block p {
                color: #64748b;
                font-size: 12px;
              }
            </style>
          </head>

          <body>
            <header>
              <h1>${contract.subject}</h1>

              <p>
                Contract number:
                ${contract.contractNumber}
              </p>
            </header>

            <div class="document" dir="ltr">
              ${renderedHtml}
            </div>

            <div class="signature-grid">
              ${employeeSignatureHtml}
              ${employerSignatureHtml}
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();

      printWindow.focus();

      window.setTimeout(
        () => {
          printWindow.print();
        },
        300,
      );
    };

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5">
      <button
        type="button"
        aria-label="Close contract viewer"
        className="absolute inset-0"
        onClick={
          onClose
        }
      />

      <div className="relative z-10 flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileSignature className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-black text-slate-950">
                Employment Contract
              </h2>

              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Review the frozen contract and both signatures.
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {contract ? (
              <button
                type="button"
                onClick={
                  handlePrint
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 transition hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5" />

                Print
              </button>
            ) : null}

            <button
              type="button"
              onClick={
                onClose
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          {contractQuery.isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : null}

          {contractQuery.isError ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600" />

                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Could not load the contract
                  </h3>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {getErrorMessage(
                      contractQuery.error,
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {contract ? (
            <div className="mx-auto space-y-5">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                      Employment Agreement
                    </p>

                    <h1 className="mt-2 text-xl font-black text-slate-950">
                      {contract.subject}
                    </h1>

                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Contract number:{" "}
                      <span className="font-black text-slate-700">
                        {contract.contractNumber}
                      </span>
                    </p>
                  </div>

                  <span
                    className={[
                      "inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide",

                      getStatusClasses(
                        contract.status,
                      ),
                    ].join(
                      " ",
                    )}
                  >
                    {contract.status ===
                    "SIGNED" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Clock3 className="h-3.5 w-3.5" />
                    )}

                    {formatStatus(
                      contract.status,
                    )}
                  </span>
                </div>
              </section>

              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4 sm:px-7">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Frozen Contract Document
                  </p>

                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                    This is the exact contract assigned to the employee.
                  </p>
                </div>

                <div className="px-5 py-7 sm:px-8 lg:px-12">
                  <div
                    dir="ltr"
                    className="contract-viewer-document text-sm leading-7 text-slate-700"
                    dangerouslySetInnerHTML={{
                      __html:
                        renderedHtml,
                    }}
                  />
                </div>
              </section>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <SignatureCard
                  title="Employee Signature"
                  description={
                    employeeSigned
                      ? "The employee has signed this contract."
                      : "The employee has not signed this contract yet."
                  }
                  signature={
                    employeeSignature
                  }
                  signedAt={
                    contract.employeeSignedAt
                  }
                  pendingMessage="The employee must log in, review the contract, and sign it."
                />

                <SignatureCard
                  title="Employer Signature"
                  description={
                    employerSigned
                      ? "The employer has countersigned this contract."
                      : "Employer countersignature is pending."
                  }
                  signature={
                    employerSignature
                  }
                  signedAt={
                    contract.employerSignedAt
                  }
                  pendingMessage={
                    employeeSigned
                      ? "An HR Manager or Business Admin can sign below."
                      : "The employee must sign before the employer can countersign."
                  }
                />
              </div>

              {!employerSigned ? (
                <section className="rounded-3xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <PenLine className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        Employer Countersignature
                      </h3>

                      <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500">
                        The employee must sign first. Then an HR Manager or Business Admin may countersign.
                      </p>
                    </div>
                  </div>

                  <SignatureCanvas
                    disabled={
                      !canEmployerSign ||
                      signMutation.isPending
                    }
                    onChange={(
                      value,
                    ) => {
                      setEmployerSignatureDataUrl(
                        value,
                      );

                      setSigningError(
                        "",
                      );
                    }}
                  />

                  <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="checkbox"
                      disabled={
                        !canEmployerSign ||
                        signMutation.isPending
                      }
                      checked={
                        employerConsent
                      }
                      onChange={(
                        event,
                      ) => {
                        setEmployerConsent(
                          event.currentTarget.checked,
                        );

                        setSigningError(
                          "",
                        );
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                    />

                    <span>
                      <span className="block text-xs font-black text-slate-800">
                        I reviewed and approve this employment contract
                      </span>

                      <span className="mt-1 block text-[11px] font-medium leading-5 text-slate-500">
                        My electronic signature and signing audit information will be recorded.
                      </span>
                    </span>
                  </label>

                  {!employeeSigned ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />

                      Waiting for the employee signature.
                    </div>
                  ) : null}

                  {signingError ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />

                      {signingError}
                    </div>
                  ) : null}

                  <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      disabled={
                        !canEmployerSign ||
                        !employerSignatureDataUrl ||
                        !employerConsent ||
                        signMutation.isPending
                      }
                      onClick={
                        handleEmployerSign
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {signMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileSignature className="h-4 w-4" />
                      )}

                      {signMutation.isPending
                        ? "Signing Contract..."
                        : "Countersign Contract"}
                    </button>
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <p className="text-[11px] font-semibold text-slate-500">
            Signed contracts preserve both signatures and audit information.
          </p>

          <button
            type="button"
            onClick={
              onClose
            }
            className="h-10 rounded-xl bg-slate-900 px-5 text-xs font-black text-white transition hover:bg-slate-800"
          >
            Close
          </button>
        </footer>
      </div>

      <style>
        {`
          .contract-viewer-document,
          .contract-viewer-document * {
            direction: ltr !important;
            text-align: left !important;
          }

          .contract-viewer-document {
            width: 100%;
            unicode-bidi: isolate;
          }

          .contract-viewer-document h1 {
            margin: 1.5rem 0 0.75rem;
            font-size: 1.5rem;
            font-weight: 900;
            color: rgb(15 23 42);
          }

          .contract-viewer-document h2 {
            margin: 1.5rem 0 0.75rem;
            font-size: 1.25rem;
            font-weight: 900;
            color: rgb(15 23 42);
          }

          .contract-viewer-document h3 {
            margin: 1.25rem 0 0.5rem;
            font-size: 1rem;
            font-weight: 900;
            color: rgb(30 41 59);
          }

          .contract-viewer-document p {
            margin: 0.75rem 0;
          }

          .contract-viewer-document ul {
            margin: 0.75rem 0;
            padding-left: 1.5rem !important;
            padding-right: 0 !important;
            list-style: disc;
          }

          .contract-viewer-document ol {
            margin: 0.75rem 0;
            padding-left: 1.5rem !important;
            padding-right: 0 !important;
            list-style: decimal;
          }

          .contract-viewer-document strong {
            font-weight: 800;
            color: rgb(30 41 59);
          }

          .contract-viewer-document table {
            width: 100%;
            margin: 1rem 0;
            border-collapse: collapse;
          }

          .contract-viewer-document td,
          .contract-viewer-document th {
            border: 1px solid rgb(203 213 225);
            padding: 0.65rem;
          }
        `}
      </style>
    </div>
  );
}
