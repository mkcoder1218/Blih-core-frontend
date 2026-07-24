import React, {
  useEffect,
  useState,
} from "react";
import {
  Loader2,
  Save,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../api/client";
import { probationApi } from "../../api/probation";
import {
  PositionCompetencyEditor,
  createEmptyCompetency,
  toCompetencyPayload,
  validateCompetencies,
  type EditablePositionCompetency,
} from "../../features/probation/components/PositionCompetencyEditor";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (
    title: string,
    type?:
      | "success"
      | "error"
      | "info",
  ) => void;
  onSuccess?: (data?: any) => void;
}

export function CreateDepartmentModal({
  isOpen,
  onClose,
  showAlert,
  onSuccess,
}: ModalProps) {
  const [name, setName] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert(
        "Name is required",
        "error",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/api/v1/departments",
        {
          name: name.trim(),
        },
      );

      const department =
        response.data?.data
          ?.department ||
        response.data?.department ||
        response.data?.data;

      showAlert(
        "Department created successfully",
        "success",
      );

      onSuccess?.(department);
      onClose();
    } catch (error: any) {
      showAlert(
        error?.response?.data
          ?.message ||
          "Failed to create department",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">
            Create New Department
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-500">
              Department Name
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="e.g. Engineering, Marketing..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white"
            />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {loading
              ? "Creating..."
              : "Create Department"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function CreatePositionModal({
  isOpen,
  onClose,
  showAlert,
  onSuccess,
  initialDeptId,
}: ModalProps & {
  initialDeptId?: string;
}) {
  const [title, setTitle] =
    useState("");

  const [deptId, setDeptId] =
    useState(
      initialDeptId || "",
    );

  const [
    departments,
    setDepartments,
  ] = useState<any[]>([]);

  const [
    competencies,
    setCompetencies,
  ] = useState<
    EditablePositionCompetency[]
  >([
    createEmptyCompetency(0),
  ]);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setTitle("");

    setDeptId(
      initialDeptId || "",
    );

    setCompetencies([
      createEmptyCompetency(0),
    ]);

    api
      .get(
        "/api/v1/departments?page=1&size=1000",
      )
      .then((response) => {
        setDepartments(
          response.data?.data
            ?.departments ||
            response.data?.rows ||
            response.data?.data ||
            [],
        );
      })
      .catch(() => {
        setDepartments([]);
      });
  }, [initialDeptId, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (
      !title.trim() ||
      !deptId
    ) {
      showAlert(
        "Title and Department are required",
        "error",
      );
      return;
    }

    const validationError =
      validateCompetencies(
        competencies,
      );

    if (validationError) {
      showAlert(
        validationError,
        "error",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/api/v1/positions",
        {
          title: title.trim(),
          departmentId: deptId,
        },
      );

      const position =
        response.data?.data
          ?.position ||
        response.data?.position ||
        response.data?.data;

      const positionId =
        position?.id;

      if (!positionId) {
        throw new Error(
          "Position was created, but its ID was not returned.",
        );
      }

      try {
        await probationApi.replacePositionCompetencies(
          positionId,
          toCompetencyPayload(
            competencies,
          ),
        );
      } catch (
        competencyError: any
      ) {
        showAlert(
          competencyError?.response
            ?.data?.message ||
            "Position was created, but probation criteria could not be saved. Open Departments & Positions to finish the criteria.",
          "error",
        );

        onSuccess?.(position);
        onClose();
        return;
      }

      showAlert(
        "Position and probation criteria created successfully",
        "success",
      );

      onSuccess?.(position);
      onClose();
    } catch (error: any) {
      showAlert(
        error?.response?.data
          ?.message ||
          error?.message ||
          "Failed to create position",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="font-black text-slate-900">
              Create New Job Position
            </h3>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Define the position and
              the criteria used for
              employee probation
              reviews.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 transition-colors hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-500">
                Department
              </label>

              <select
                value={deptId}
                onChange={(event) =>
                  setDeptId(
                    event.target
                      .value,
                  )
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white disabled:opacity-60"
              >
                <option value="">
                  Select Department
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={
                        department.id
                      }
                      value={
                        department.id
                      }
                    >
                      {
                        department.name
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-500">
                Position Title
              </label>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target
                      .value,
                  )
                }
                disabled={loading}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white disabled:opacity-60"
              />
            </div>
          </div>

          <PositionCompetencyEditor
            rows={competencies}
            onChange={
              setCompetencies
            }
            disabled={loading}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {loading
              ? "Creating..."
              : "Create Position"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
