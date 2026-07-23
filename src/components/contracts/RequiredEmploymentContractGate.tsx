import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Eraser,
  FileSignature,
  Loader2,
  PenLine,
  ShieldCheck,
} from "lucide-react";

import {
  useMyPendingEmploymentContract,
  useSignMyEmploymentContract,
} from "../../hooks/useMyEmploymentContract";

interface RequiredEmploymentContractGateProps {
  children: ReactNode;
}

function getErrorMessage(
  error: unknown,
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
      "Something went wrong"
    );
  }

  return "Something went wrong";
}

function EmployeeSignatureCanvas({
  onSignatureChange,
}: {
  onSignatureChange: (
    value: string,
  ) => void;
}) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null,
    );

  const drawingRef =
    useRef(false);

  const [
    hasSignature,
    setHasSignature,
  ] = useState(false);

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
        parent.clientWidth;

      const height =
        190;

      canvas.width =
        width * ratio;

      canvas.height =
        height * ratio;

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

      context.scale(
        ratio,
        ratio,
      );

      context.lineCap =
        "round";

      context.lineJoin =
        "round";

      context.lineWidth =
        2.25;

      context.strokeStyle =
        "#0f172a";

      context.fillStyle =
        "#ffffff";

      context.fillRect(
        0,
        0,
        width,
        height,
      );

      setHasSignature(
        false,
      );

      onSignatureChange(
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

  const getCoordinates = (
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

  const publishSignature =
    () => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      onSignatureChange(
        canvas.toDataURL(
          "image/png",
          0.9,
        ),
      );
  };

  const handlePointerDown = (
    event:
      ReactPointerEvent<HTMLCanvasElement>,
  ) => {
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
      getCoordinates(
        event,
      );

    context.beginPath();

    context.moveTo(
      point.x,
      point.y,
    );
  };

  const handlePointerMove = (
    event:
      ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (
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
      getCoordinates(
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

  const handlePointerEnd = (
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
      drawingRef.current
    ) {
      drawingRef.current =
        false;

      publishSignature();
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
          className="block w-full touch-none cursor-crosshair bg-white"
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium text-slate-500">
          Draw your signature using your mouse, touchpad, or touchscreen.
        </p>

        <button
          type="button"
          onClick={
            configureCanvas
          }
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-600 transition hover:bg-slate-50"
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

export default function RequiredEmploymentContractGate({
  children,
}: RequiredEmploymentContractGateProps) {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } =
    useMyPendingEmploymentContract();

  const signMutation =
    useSignMyEmploymentContract();

  const [
    signatureDataUrl,
    setSignatureDataUrl,
  ] = useState("");

  const [
    consent,
    setConsent,
  ] = useState(false);

  const [
    localError,
    setLocalError,
  ] = useState("");

  if (
    isLoading ||
    (
      isFetching &&
      !data
    )
  ) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />

          <p className="text-sm font-bold text-slate-600">
            Checking employment contract...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-6 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <h1 className="text-sm font-black text-slate-900">
                Contract verification failed
              </h1>

              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                {getErrorMessage(
                  error,
                )}
              </p>

              <button
                type="button"
                onClick={() =>
                  refetch()
                }
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contract =
    data?.contract;

  if (
    !data?.required ||
    !contract ||
    contract.employeeSignedAt
  ) {
    return (
      <>
        {children}
      </>
    );
  }

  const renderedHtml =
    contract.renderedHtml ||
    contract.bodyHtml;

  const handleSign =
    async () => {
      setLocalError(
        "",
      );

      if (
        !signatureDataUrl
      ) {
        setLocalError(
          "Please draw your signature before continuing.",
        );

        return;
      }

      if (!consent) {
        setLocalError(
          "Confirm that you reviewed and accept the employment contract.",
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

            signatureDataUrl,
          },
        });

        await refetch();
      } catch (
        mutationError
      ) {
        setLocalError(
          getErrorMessage(
            mutationError,
          ),
        );
      }
    };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 rounded-3xl border border-blue-200 bg-blue-600 px-5 py-4 text-white shadow-lg shadow-blue-600/15 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <FileSignature className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-base font-black">
                Employment contract requires your signature
              </h1>

              <p className="mt-1 text-xs font-medium leading-5 text-blue-100">
                Review the complete agreement and sign at the bottom. Access to the ERP will become available immediately after signing.
              </p>
            </div>
          </div>
        </div>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <header className="border-b border-slate-200 px-5 py-5 sm:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Employment Agreement
                </p>

                <h2 className="mt-2 text-xl font-black text-slate-950">
                  {contract.subject}
                </h2>

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Contract number:{" "}
                  <span className="font-black text-slate-700">
                    {contract.contractNumber}
                  </span>
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
                <PenLine className="h-3.5 w-3.5" />
                Signature Required
              </span>
            </div>
          </header>

          <div className="px-5 py-7 sm:px-8 lg:px-12">
            <div
              className="contract-document text-sm leading-7 text-slate-700"
              dangerouslySetInnerHTML={{
                __html:
                  renderedHtml,
              }}
            />

            <div className="mt-10 border-t border-slate-200 pt-8">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <PenLine className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Employee Signature
                  </h3>

                  <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500">
                    Your signature confirms that you reviewed and accepted this employment agreement.
                  </p>
                </div>
              </div>

              <EmployeeSignatureCanvas
                onSignatureChange={(
                  value,
                ) => {
                  setSignatureDataUrl(
                    value,
                  );

                  setLocalError(
                    "",
                  );
                }}
              />

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={
                    consent
                  }
                  onChange={(
                    event,
                  ) => {
                    setConsent(
                      event.currentTarget.checked,
                    );

                    setLocalError(
                      "",
                    );
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span>
                  <span className="block text-xs font-black text-slate-800">
                    I have reviewed and accept this employment contract
                  </span>

                  <span className="mt-1 block text-[11px] font-medium leading-5 text-slate-500">
                    I understand that my electronic signature will be recorded with the signing date and security audit information.
                  </span>
                </span>
              </label>

              {localError ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {localError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col items-stretch justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Your signature is recorded with date, account, IP address, and browser details.
                </div>

                <button
                  type="button"
                  onClick={
                    handleSign
                  }
                  disabled={
                    signMutation.isPending ||
                    !signatureDataUrl ||
                    !consent
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
                    : "Sign and Continue"}
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <style>
        {`
          .contract-document h1 {
            margin: 1.5rem 0 0.75rem;
            font-size: 1.5rem;
            font-weight: 900;
            color: rgb(15 23 42);
          }

          .contract-document h2 {
            margin: 1.5rem 0 0.75rem;
            font-size: 1.25rem;
            font-weight: 900;
            color: rgb(15 23 42);
          }

          .contract-document h3 {
            margin: 1.25rem 0 0.5rem;
            font-size: 1rem;
            font-weight: 900;
            color: rgb(30 41 59);
          }

          .contract-document p {
            margin: 0.75rem 0;
          }

          .contract-document ul {
            margin: 0.75rem 0;
            padding-left: 1.5rem;
            list-style: disc;
          }

          .contract-document ol {
            margin: 0.75rem 0;
            padding-left: 1.5rem;
            list-style: decimal;
          }

          .contract-document strong {
            font-weight: 800;
            color: rgb(30 41 59);
          }

          .contract-document a {
            color: rgb(37 99 235);
            text-decoration: underline;
          }
        `}
      </style>
    </div>
  );
}
