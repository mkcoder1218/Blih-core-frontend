import type {
  Dispatch,
  SetStateAction,
} from "react";
import { api } from "../../../api/client";
import { initializeEmployeeProbation } from "../../../api/employeeProbation";
import type {
  AlertType,
  EmployeeFormData,
  EmployeeModalMode,
} from "./types";
import {
  buildCreatePayload,
  buildUpdatePayload,
  extractCreatedUserId,
} from "./utils";

interface SubmitArgs {
  mode: EmployeeModalMode;
  targetUserId?: string;

  formData: EmployeeFormData;
  files: Record<string, File>;
  selectedOfferTemplate: string;

  initialUpdateSnapshot:
    | EmployeeFormData
    | null;

  requiresProbation: boolean;
  finalApproverUserId: string;
  probationStartDate: string;
  probationDurationMonths: number;
  probationExpectedEndDate: string;
  probationCompetenciesReady: boolean;

  draftId: string | null;

  setCurrentStep: Dispatch<
    SetStateAction<number>
  >;

  setLoading: Dispatch<
    SetStateAction<boolean>
  >;

  showAlert: (
    title: string,
    type?: AlertType,
  ) => void;

  onSuccess?: () => void;
  onClose: () => void;
}

async function uploadFile(
  file: File,
) {
  const body = new FormData();

  body.append("file", file);

  const response =
    await api.post(
      "/api/v1/files/upload",
      body,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      },
    );

  return response.data;
}

export function createEmployeeSubmitHandler(
  args: SubmitArgs,
) {
  return async () => {
    const {
      mode,
      targetUserId,
      formData,
      files,
      selectedOfferTemplate,
      initialUpdateSnapshot,
      requiresProbation,
      finalApproverUserId,
      probationStartDate,
      probationDurationMonths,
      probationExpectedEndDate,
      probationCompetenciesReady,
      draftId,
      setCurrentStep,
      setLoading,
      showAlert,
      onSuccess,
      onClose,
    } = args;

    if (
      formData.employmentType ===
        "intern" &&
      formData.internshipStipendType ===
        "paid" &&
      !formData.bankAccountNumber.trim()
    ) {
      setCurrentStep(1);

      showAlert(
        "Awash account number is required for paid interns",
        "error",
      );

      return;
    }

    if (
      mode === "create" &&
      requiresProbation
    ) {
      const checks: Array<
        [boolean, string]
      > = [
        [
          !formData.departmentId,
          "Select a department before enabling probation.",
        ],
        [
          !formData.positionId,
          "Select a position before enabling probation.",
        ],
        [
          !formData.reportingTo,
          "Select a reporting manager for probation.",
        ],
        [
          !probationStartDate,
          "Select a probation start date.",
        ],
        [
          !Number.isFinite(
            probationDurationMonths,
          ) ||
            probationDurationMonths <
              1,

          "Probation duration must be at least one month.",
        ],
        [
          !probationCompetenciesReady,

          "The selected position needs active probation competencies totaling exactly 100%.",
        ],
      ];

      const failed =
        checks.find(
          ([condition]) =>
            condition,
        );

      if (failed) {
        setCurrentStep(1);

        showAlert(
          failed[1],
          "error",
        );

        return;
      }
    }

    setLoading(true);

    try {
      const uploads: Record<
        string,
        any
      > = {};

      for (const [
        key,
        file,
      ] of Object.entries(files)) {
        const result =
          await uploadFile(file);

        uploads[key] =
          result.data?.file ||
          result.file ||
          result;
      }

      if (mode === "update") {
        if (!targetUserId) {
          throw new Error(
            "Missing target user id for update",
          );
        }

        if (
          !initialUpdateSnapshot
        ) {
          throw new Error(
            "Update baseline not loaded",
          );
        }

        const payload =
          buildUpdatePayload(
            formData,
            initialUpdateSnapshot,
            uploads,
          );

        if (
          !Object.keys(
            payload,
          ).length
        ) {
          showAlert(
            "No changes to update.",
            "info",
          );

          onClose();

          return;
        }

        await api.patch(
          `/api/v1/hr/records/${targetUserId}`,
          payload,
        );

        showAlert(
          "Employee Profile successfully updated!",
          "success",
        );
      } else {
        const response =
          await api.post(
            "/api/v1/hr/records/onboard",

            buildCreatePayload(
              formData,
              uploads,
              selectedOfferTemplate,
            ),
          );

        const createdUserId =
          extractCreatedUserId(
            response,
          );

        if (requiresProbation) {
          if (!createdUserId) {
            throw new Error(
              "Employee was created, but the user ID was not returned, so probation could not be initialized.",
            );
          }

          await initializeEmployeeProbation(
            {
              employeeUserId:
                createdUserId,

              startDate:
                probationStartDate,

              durationMonths:
                probationDurationMonths,

              expectedEndDate:
                probationExpectedEndDate,

              managerUserId:
                formData.reportingTo,

              finalApproverUserId:
                finalApproverUserId ||
                null,

              source:
                "EXISTING_EMPLOYEE",

              status: "ACTIVE",

              notes:
                formData.additionalNotes.trim() ||
                null,

              metadata: {
                initializedDuringEmployeeCreation:
                  true,

                initializationChannel:
                  "MANUAL_EMPLOYEE_CREATION",
              },
            },
          );

          showAlert(
            "Employee Profile created and probation initialized successfully!",
            "success",
          );
        } else {
          showAlert(
            "Employee Profile successfully created!",
            "success",
          );
        }

        if (draftId) {
          await api
            .delete(
              `/api/v1/people/profile-drafts/${draftId}`,
            )
            .catch(
              () => undefined,
            );
        }
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(
        "Error submitting employee onboarding",
        error,
      );

      showAlert(
        error?.response?.data
          ?.message ||
          error?.message ||
          (mode === "update"
            ? "Failed to update profile"
            : "Failed to create profile"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };
}
