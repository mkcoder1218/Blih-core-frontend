import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import OfferLetterTemplateModal from "../offer-letters/OfferLetterTemplateModal";
import {
  CreateDepartmentModal,
  CreatePositionModal,
} from "./OrgModals";
import { EmployeeFormProvider } from "./create-employee/context";
import { useCreateEmployeeController } from "./create-employee/useCreateEmployeeController";
import { EMPLOYEE_STEPS } from "./create-employee/utils";
import type { CreateEmployeeModalProps } from "./create-employee/types";
import AccountStep from "./create-employee/AccountStep";
import EmploymentStep from "./create-employee/EmploymentStep";
import PersonalBankStep from "./create-employee/PersonalBankStep";
import EmergencyStep from "./create-employee/EmergencyStep";
import DocumentsStep from "./create-employee/DocumentsStep";
import EditEmployeeProfileModal from "./create-employee/EditEmployeeProfileModal";

function ActiveStep({
  step,
}: {
  step: number;
}) {
  return (
    <AnimatePresence mode="wait">
      {step === 0 ? (
        <AccountStep key="account" />
      ) : null}

      {step === 1 ? (
        <EmploymentStep key="employment" />
      ) : null}

      {step === 2 ? (
        <PersonalBankStep key="personal" />
      ) : null}

      {step === 3 ? (
        <EmergencyStep key="emergency" />
      ) : null}

      {step === 4 ? (
        <DocumentsStep key="documents" />
      ) : null}
    </AnimatePresence>
  );
}

function CreateEmployeeWizard(
  props: CreateEmployeeModalProps,
) {
  const controller =
    useCreateEmployeeController(props);

  const {
    isOpen,
    onClose,
    mode,
    currentStep,
    setCurrentStep,
    loading,
    isIntern,
    isSavingDraft,
    lastSaved,
    formData,
    allPositions,
    selectedOfferTemplate,
    offerLetterTemplates,
    showOfferLetterModal,
    setShowOfferLetterModal,
    showCreateDept,
    setShowCreateDept,
    showCreatePos,
    setShowCreatePos,
    canCreateDepartment,
    canCreatePosition,
    loadOrgData,
    loadPositionsForDepartment,
    refreshOfferLetterTemplates,
    setFormData,
    showAlert,
    handleSubmit,
  } = controller;

  if (!isOpen) {
    return null;
  }

  return (
    <EmployeeFormProvider
      value={controller}
    >
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
            y: 10,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                {mode === "update"
                  ? "Update Employee Profile"
                  : "Create New Employee Profile"}
              </h2>

              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-xs font-medium text-slate-500">
                  Fill in the required information to
                  onboard your employee.
                </p>

                {isSavingDraft ? (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                    Saving...
                  </span>
                ) : lastSaved ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Draft saved
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="border-b border-slate-100 bg-white px-8 py-5">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-slate-100" />

              <div
                className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-blue-600 transition-all"
                style={{
                  width: `${
                    (currentStep /
                      (EMPLOYEE_STEPS.length -
                        1)) *
                    100
                  }%`,
                }}
              />

              {EMPLOYEE_STEPS.map(
                (step, index) => (
                  <div
                    key={step.id}
                    className="relative z-10 flex flex-col items-center gap-2 bg-white px-2"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                        index < currentStep
                          ? "border-blue-600 bg-blue-600 text-white"
                          : index ===
                              currentStep
                            ? "border-blue-600 bg-white text-blue-600"
                            : "border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                    >
                      {index <
                      currentStep ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <span
                      className={`absolute -bottom-7 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider ${
                        index <=
                        currentStep
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <main className="custom-scrollbar flex-1 overflow-y-auto bg-white p-8 py-10">
            <ActiveStep
              step={currentStep}
            />
          </main>

          <footer className="flex items-center justify-between rounded-b-3xl border-t border-slate-100 bg-slate-50/50 px-8 py-5">
            <button
              type="button"
              onClick={() =>
                setCurrentStep((value) =>
                  Math.max(
                    0,
                    value - 1,
                  ),
                )
              }
              disabled={
                currentStep === 0
              }
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200"
              >
                Cancel
              </button>

              {currentStep <
              EMPLOYEE_STEPS.length -
                1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentStep(
                      (value) =>
                        value + 1,
                    )
                  }
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-extrabold text-white hover:bg-blue-700"
                >
                  Next Step

                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={
                    handleSubmit
                  }
                  className="rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading
                    ? mode ===
                      "update"
                      ? "Updating Profile..."
                      : "Creating Profile..."
                    : mode ===
                        "update"
                      ? "Update Profile"
                      : isIntern
                        ? "Create Intern Profile"
                        : "Create Employee Profile"}
                </button>
              )}
            </div>
          </footer>
        </motion.div>

        {showOfferLetterModal ? (
          <OfferLetterTemplateModal
            isOpen
            onClose={() =>
              setShowOfferLetterModal(
                false,
              )
            }
            showAlert={showAlert}
            initialData={
              selectedOfferTemplate
                ? offerLetterTemplates.find(
                    (item) =>
                      item.id ===
                      selectedOfferTemplate,
                  )
                : {
                    name: `Offer for ${formData.firstName} ${formData.lastName}`.trim(),

                    subject: `Job Offer: ${
                      allPositions.find(
                        (item) =>
                          item.id ===
                          formData.positionId,
                      )?.title || ""
                    } - Blih`,

                    bodyHtml:
                      '<div style="font-family:sans-serif;padding:20px"><h1>Job Offer</h1><p>Dear {{name}},</p><p>We are excited to offer you the position of <strong>{{positionTitle}}</strong> at Blih.</p><p>Starting Date: {{startDate}}</p><p>Monthly Salary: {{salary}}</p><p><a href="{{acceptUrl}}">Accept Offer</a></p><p>Best regards,<br/>Blih HR Team</p></div>',
                  }
            }
            onSuccess={() => {
              setShowOfferLetterModal(
                false,
              );

              showAlert(
                "Offer template generated! You can now select it from the dropdown.",
                "success",
              );

              refreshOfferLetterTemplates();
            }}
          />
        ) : null}

        {canCreateDepartment &&
        showCreateDept ? (
          <CreateDepartmentModal
            isOpen
            onClose={() =>
              setShowCreateDept(
                false,
              )
            }
            showAlert={showAlert}
            onSuccess={(
              department,
            ) => {
              loadOrgData();

              setFormData(
                (value) => ({
                  ...value,
                  departmentId:
                    department.id,
                }),
              );
            }}
          />
        ) : null}

        {canCreatePosition &&
        showCreatePos ? (
          <CreatePositionModal
            isOpen
            onClose={() =>
              setShowCreatePos(
                false,
              )
            }
            showAlert={showAlert}
            initialDeptId={
              formData.departmentId
            }
            onSuccess={(
              position,
            ) => {
              loadOrgData();

              if (
                position.departmentId
              ) {
                loadPositionsForDepartment(
                  position.departmentId,
                );
              }

              setFormData(
                (value) => ({
                  ...value,
                  departmentId:
                    position.departmentId,
                  positionId:
                    position.id,
                }),
              );
            }}
          />
        ) : null}
      </div>
    </EmployeeFormProvider>
  );
}


export default function CreateEmployeeModal(props: CreateEmployeeModalProps) {
  if (props.mode === "update") {
    return <EditEmployeeProfileModal {...props} />;
  }

  return <CreateEmployeeWizard {...props} />;
}
