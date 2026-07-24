import React, {
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Hourglass,
  Mail,
  Pencil,
  Upload,
  User,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "motion/react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../../api/client";
import { useMyPermissions } from "../../hooks/usePermissions";
import { InitializeProbationDialog } from "../../features/probation/components/InitializeProbationDialog";

type ProfileTab =
  | "personal"
  | "professional"
  | "documents";

type SideTab =
  | "profile"
  | "attendance"
  | "performance"
  | "leave";

interface EmployeeDetailPageProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };

  onBack: () => void;
  onEdit?: () => void;
  readOnly?: boolean;
  targetUserId?: string;
}

const blank = "-";

function display(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return blank;
  }

  const text =
    String(value).trim();

  return text || blank;
}

function imageSrc(
  path?: string | null,
) {
  if (!path) return null;

  if (
    /^https?:\/\//i.test(path)
  ) {
    return path;
  }

  const base = String(
    import.meta.env
      .VITE_API_BASE_URL || "",
  ).replace(/\/$/, "");

  return `${base}${
    path.startsWith("/")
      ? path
      : `/${path}`
  }`;
}

function formatDate(
  value?: string | null,
) {
  return value
    ? new Date(
        value,
      ).toLocaleDateString()
    : blank;
}

function formatTime(
  value?: string | null,
) {
  return value
    ? new Date(
        value,
      ).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      )
    : blank;
}

function formatMinutes(
  value?: number | null,
) {
  if (
    value === undefined ||
    value === null
  ) {
    return blank;
  }

  const hours = Math.floor(
    value / 60,
  );

  const minutes =
    value % 60;

  return `${hours}h ${minutes}m`;
}

function attendanceStatus(
  row: any,
) {
  const status = String(
    row?.calculation
      ?.currentStatus || "",
  ).toLowerCase();

  if (
    status.includes("late")
  ) {
    return "Late";
  }

  if (
    status.includes("leave")
  ) {
    return "Leave";
  }

  if (
    status.includes("absent") ||
    status.includes("missed")
  ) {
    return "Absent";
  }

  if (
    row?.events?.checkInAtUtc
  ) {
    return "Present";
  }

  return display(
    row?.calculation
      ?.currentStatus,
  );
}

function initials(
  name: string,
) {
  return display(name)
    .split(/\s+/)
    .map(
      (part) => part[0],
    )
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[11px] font-medium text-slate-400">
        {label}
      </p>

      <p className="break-words text-[13px] font-semibold text-slate-900">
        {display(value)}
      </p>
    </div>
  );
}

export default function EmployeeDetailPage({
  user,
  onBack,
  onEdit,
  readOnly = false,
  targetUserId,
}: EmployeeDetailPageProps) {
  const [
    activeSideTab,
    setActiveSideTab,
  ] =
    useState<SideTab>("profile");

  const [
    activeProfileTab,
    setActiveProfileTab,
  ] =
    useState<ProfileTab>(
      "personal",
    );

  const [
    attendancePage,
    setAttendancePage,
  ] = useState(1);

  const [editing, setEditing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    probationDialogOpen,
    setProbationDialogOpen,
  ] = useState(false);

  const [
    file,
    setFile,
  ] =
    useState<File | null>(null);

  const [
    documentFile,
    setDocumentFile,
  ] =
    useState<File | null>(null);

  const queryClient =
    useQueryClient();

  const permissions =
    useMyPermissions();

  const profileQuery =
    useQuery({
      queryKey: targetUserId
        ? [
            "employee-profile",
            targetUserId,
          ]
        : ["my-profile"],

      queryFn: async () => {
        const response =
          await api.get(
            targetUserId
              ? `/api/v1/profiles/user/${targetUserId}`
              : "/api/v1/profiles/me",
          );

        return (
          response.data
            ?.profile ||
          response.data?.data
            ?.profile ||
          response.data?.data
        );
      },
    });

  const profile =
    profileQuery.data;

  const settings =
    profile?.settings || {};

  const profileUser =
    profile?.User ||
    profile?.user ||
    {};

  const employeeRecord =
    profile?.employeeRecord ||
    profile?.EmployeeRecord ||
    {};

  const fullName =
    settings.fullName ||
    profileUser.fullName ||
    profile?.fullName ||
    user?.name ||
    "";

  const email =
    settings.email ||
    profile?.workEmail ||
    profileUser.email ||
    user?.email ||
    "";

  const phone =
    settings.phone ||
    profile?.workPhone ||
    profileUser.phone ||
    "";

  const role =
    profile?.position?.title ||
    profile?.department?.name ||
    user?.role ||
    "";

  const avatarUrl =
    imageSrc(
      settings.profileImageUrl,
    );

  const formDefaults =
    useMemo(
      () => ({
        fullName:
          fullName || "",

        phone: phone || "",

        address:
          settings.address ||
          "",

        city:
          settings.city || "",

        country:
          settings.country ||
          "",

        zipCode:
          settings.zipCode ||
          "",

        dateOfBirth:
          settings.dateOfBirth ||
          "",

        maritalStatus:
          settings.maritalStatus ||
          "",

        gender:
          settings.gender || "",

        nationality:
          settings.nationality ||
          "",
      }),
      [
        fullName,
        phone,
        settings,
      ],
    );

  const [form, setForm] =
    useState(formDefaults);

  React.useEffect(() => {
    setForm(formDefaults);
  }, [formDefaults]);

  const documentsQuery =
    useQuery({
      queryKey: targetUserId
        ? [
            "employee-profile-documents",
            targetUserId,
          ]
        : [
            "my-profile-documents",
          ],

      enabled:
        activeProfileTab ===
        "documents",

      queryFn: async () => {
        const response =
          await api.get(
            targetUserId
              ? `/api/v1/profiles/user/${targetUserId}/documents`
              : "/api/v1/profiles/me/documents",
          );

        return (
          response.data
            ?.documents ||
          response.data?.data
            ?.documents ||
          response.data?.data ||
          []
        );
      },
    });

  const attendanceQuery =
    useQuery({
      queryKey: targetUserId
        ? [
            "employee-attendance-history",
            targetUserId,
            employeeRecord.createdAt,
            profileUser.createdAt,
          ]
        : [
            "my-attendance-history",
          ],

      enabled:
        activeSideTab ===
          "attendance" &&
        (!targetUserId ||
          Boolean(profile)),

      queryFn: async () => {
        if (targetUserId) {
          const today =
            new Date();

          const createdAt =
            profile?.attendanceStartDate ||
            employeeRecord.createdAt ||
            profileUser.createdAt ||
            profile?.createdAt;

          const start = createdAt
            ? new Date(createdAt)
            : new Date(today);

          if (!createdAt) {
            start.setDate(
              today.getDate() -
                30,
            );
          }

          const response =
            await api.get(
              "/api/v1/attendance/hr/report",
              {
                params: {
                  employeeId:
                    targetUserId,

                  startDate:
                    start
                      .toISOString()
                      .slice(
                        0,
                        10,
                      ),

                  endDate:
                    today
                      .toISOString()
                      .slice(
                        0,
                        10,
                      ),
                },
              },
            );

          const rows =
            response.data?.data
              ?.rows || [];

          return rows.map(
            (row: any) => ({
              date: row.date,

              events: {
                checkInAtUtc:
                  row.checkInAtUtc,

                checkOutAtUtc:
                  row.checkOutAtUtc,
              },

              calculation: {
                currentStatus:
                  row.currentStatus,

                totalWorkedMinutes:
                  row.totalWorkedMinutes,
              },
            }),
          );
        }

        const response =
          await api.get(
            "/api/v1/attendance/me/history",
            {
              params: {
                page: 1,
                size: 30,
              },
            },
          );

        return (
          response.data?.data
            ?.rows || []
        );
      },
    });

  React.useEffect(() => {
    setAttendancePage(1);
  }, [
    targetUserId,
    activeSideTab,
  ]);

  const updateProfile =
    useMutation({
      mutationFn: async () => {
        const data =
          new FormData();

        Object.entries(
          form,
        ).forEach(
          ([key, value]) => {
            data.append(
              key,
              typeof value ===
                "string"
                ? value
                : "",
            );
          },
        );

        if (file) {
          data.append(
            "profileImage",
            file,
          );
        }

        const response =
          await api.patch(
            "/api/v1/profiles/me",
            data,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            },
          );

        return (
          response.data
            ?.profile ||
          response.data?.data
        );
      },

      onSuccess: (
        updated,
      ) => {
        queryClient.setQueryData(
          ["my-profile"],
          updated,
        );

        setEditing(false);
        setFile(null);
        setError("");
      },

      onError: (
        caught: any,
      ) => {
        setError(
          caught?.response?.data
            ?.message ||
            caught?.message ||
            "Profile update failed",
        );
      },
    });

  const uploadDocument =
    useMutation({
      mutationFn: async () => {
        if (!documentFile) {
          return null;
        }

        const data =
          new FormData();

        data.append(
          "document",
          documentFile,
        );

        const response =
          await api.post(
            targetUserId
              ? `/api/v1/profiles/user/${targetUserId}/documents`
              : "/api/v1/profiles/me/documents",
            data,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            },
          );

        return (
          response.data
            ?.document ||
          response.data?.data
        );
      },

      onSuccess: () => {
        setDocumentFile(null);

        queryClient.invalidateQueries(
          {
            queryKey:
              targetUserId
                ? [
                    "employee-profile-documents",
                    targetUserId,
                  ]
                : [
                    "my-profile-documents",
                  ],
          },
        );
      },

      onError: (
        caught: any,
      ) => {
        setError(
          caught?.response?.data
            ?.message ||
            caught?.message ||
            "Document upload failed",
        );
      },
    });

  const openDocument = async (
    document: any,
    mode:
      | "preview"
      | "download",
  ) => {
    if (document.fileId) {
      const tokenResponse =
        await api.get(
          `/api/v1/files/${document.fileId}/token`,
        );

      const token =
        tokenResponse.data
          ?.token ||
        tokenResponse.data?.data
          ?.token;

      const preview =
        mode === "preview"
          ? "&preview=1"
          : "";

      const base = String(
        import.meta.env
          .VITE_API_BASE_URL ||
          "",
      ).replace(/\/$/, "");

      window.open(
        `${base}/api/v1/files/${document.fileId}/download?token=${encodeURIComponent(
          token,
        )}${preview}`,
        "_blank",
      );

      return;
    }

    const url = imageSrc(
      mode === "preview"
        ? document.previewUrl ||
            document.downloadUrl
        : document.downloadUrl ||
            document.previewUrl,
    );

    if (url) {
      window.open(
        url,
        "_blank",
      );
    }
  };

  const sideNavItems: Array<{
    id: SideTab;
    label: string;
    icon: React.ElementType;
  }> = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: Calendar,
    },
    {
      id: "performance",
      label: "Performance",
      icon: ClipboardList,
    },
    {
      id: "leave",
      label: "Leave",
      icon: FileText,
    },
  ];

  const profileTabs: Array<{
    id: ProfileTab;
    label: string;
    icon: React.ElementType;
  }> = [
    {
      id: "personal",
      label:
        "Personal Information",
      icon: User,
    },
    {
      id: "professional",
      label:
        "Professional Information",
      icon: Briefcase,
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
    },
  ];

  const attendanceRows =
    attendanceQuery.data || [];

  const attendancePageSize =
    10;

  const attendanceTotalPages =
    Math.max(
      1,
      Math.ceil(
        attendanceRows.length /
          attendancePageSize,
      ),
    );

  const visibleAttendanceRows =
    attendanceRows.slice(
      (attendancePage - 1) *
        attendancePageSize,

      attendancePage *
        attendancePageSize,
    );

  const canInitializeProbation =
    Boolean(targetUserId) &&
    permissions.hasAny(
      "performance.manage",
      "onboarding.manage",
      "hr.write",
    );

  return (
    <div className="min-h-full space-y-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="group mb-0.5 flex items-center gap-1.5 text-slate-700 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />

          <span className="text-sm font-bold">
            {targetUserId
              ? "Employee Detail"
              : "My Profile"}
          </span>
        </button>

        <p className="pl-6 text-[12px] font-medium text-slate-500">
          {targetUserId
            ? "Directory employee information"
            : "Current employee information"}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-100 bg-blue-100 text-xl font-black text-blue-600">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(fullName)
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <h3 className="truncate text-[17px] font-black tracking-tight text-slate-900">
                {display(fullName)}
              </h3>

              <div className="flex items-center gap-1.5 text-slate-500">
                <Briefcase className="h-3.5 w-3.5" />

                <span className="text-xs font-medium">
                  {display(role)}
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-1.5 text-slate-500">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />

                <span className="truncate text-xs font-medium">
                  {display(email)}
                </span>
              </div>
            </div>
          </div>

          {!readOnly ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {canInitializeProbation ? (
                <button
                  type="button"
                  onClick={() =>
                    setProbationDialogOpen(
                      true,
                    )
                  }
                  className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
                >
                  <Hourglass className="h-3.5 w-3.5" />

                  Initialize Probation
                </button>
              ) : null}

              <button
                type="button"
                onClick={() =>
                  targetUserId
                    ? onEdit?.()
                    : setEditing(true)
                }
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
              >
                <Pencil className="h-3.5 w-3.5" />

                {targetUserId
                  ? "Update Record"
                  : "Edit Profile"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex">
          <div className="w-52 flex-shrink-0 space-y-1 border-r border-slate-100 px-3 py-4">
            {sideNavItems.map(
              ({
                id,
                label,
                icon: Icon,
              }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() =>
                    setActiveSideTab(
                      id,
                    )
                  }
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    activeSideTab ===
                    id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />

                  {label}
                </button>
              ),
            )}
          </div>

          <div className="min-w-0 flex-1 p-6">
            {profileQuery.isLoading ? (
              <p className="text-xs font-semibold text-slate-400">
                Loading profile...
              </p>
            ) : activeSideTab ===
              "profile" ? (
              <>
                <div className="mb-6 flex items-center gap-6 border-b border-slate-100">
                  {profileTabs.map(
                    ({
                      id,
                      label,
                      icon: Icon,
                    }) => (
                      <button
                        type="button"
                        key={id}
                        onClick={() =>
                          setActiveProfileTab(
                            id,
                          )
                        }
                        className={`flex items-center gap-2 border-b-2 pb-3 text-xs font-semibold transition-all ${
                          activeProfileTab ===
                          id
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />

                        {label}
                      </button>
                    ),
                  )}
                </div>

                {activeProfileTab ===
                "personal" ? (
                  <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
                    <InfoField
                      label="Full Name"
                      value={fullName}
                    />

                    <InfoField
                      label="Email Address"
                      value={email}
                    />

                    <InfoField
                      label="Mobile Number"
                      value={phone}
                    />

                    <InfoField
                      label="Date of Birth"
                      value={
                        settings.dateOfBirth
                          ? formatDate(
                              settings.dateOfBirth,
                            )
                          : ""
                      }
                    />

                    <InfoField
                      label="Marital Status"
                      value={
                        settings.maritalStatus
                      }
                    />

                    <InfoField
                      label="Gender"
                      value={
                        settings.gender
                      }
                    />

                    <InfoField
                      label="Nationality"
                      value={
                        settings.nationality
                      }
                    />

                    <InfoField
                      label="Address"
                      value={
                        settings.address
                      }
                    />

                    <InfoField
                      label="City"
                      value={
                        settings.city
                      }
                    />

                    <InfoField
                      label="Country"
                      value={
                        settings.country
                      }
                    />

                    <InfoField
                      label="Zip Code"
                      value={
                        settings.zipCode
                      }
                    />
                  </div>
                ) : null}

                {activeProfileTab ===
                "professional" ? (
                  <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
                    <InfoField
                      label="Employee Code"
                      value={
                        profile?.employeeCode ||
                        employeeRecord.employeeCode
                      }
                    />

                    <InfoField
                      label="Department"
                      value={
                        profile?.department
                          ?.name
                      }
                    />

                    <InfoField
                      label="Position"
                      value={
                        profile?.position
                          ?.title
                      }
                    />

                    <InfoField
                      label="Work Email"
                      value={
                        profile?.workEmail ||
                        email
                      }
                    />

                    <InfoField
                      label="Work Phone"
                      value={
                        profile?.workPhone ||
                        phone
                      }
                    />

                    <InfoField
                      label="Employee Type"
                      value={
                        profile?.employmentType ||
                        employeeRecord.employmentType
                      }
                    />

                    <InfoField
                      label="Joining Date"
                      value={formatDate(
                        profile?.joinedAt ||
                          employeeRecord.hireDate,
                      )}
                    />

                    <InfoField
                      label="Status"
                      value={
                        profile?.status ||
                        employeeRecord.employmentStatus
                      }
                    />

                    <InfoField
                      label="Reporting Manager"
                      value={
                        profile?.manager
                          ?.fullName ||
                        profile
                          ?.reportingManager
                          ?.fullName
                      }
                    />

                    <InfoField
                      label="Probation End Date"
                      value={formatDate(
                        employeeRecord.probationEndDate,
                      )}
                    />
                  </div>
                ) : null}

                {activeProfileTab ===
                "documents" ? (
                  <div className="space-y-4">
                    {!readOnly ? (
                      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-3 sm:flex-row sm:items-center">
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-xs font-semibold text-slate-600">
                          <Upload className="h-4 w-4 flex-shrink-0 text-blue-600" />

                          <span className="truncate">
                            {documentFile
                              ? documentFile.name
                              : "Upload employee document"}
                          </span>

                          <input
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp,.doc,.docx"
                            className="hidden"
                            onChange={(
                              event,
                            ) =>
                              setDocumentFile(
                                event
                                  .target
                                  .files?.[0] ||
                                  null,
                              )
                            }
                          />
                        </label>

                        <button
                          type="button"
                          disabled={
                            !documentFile ||
                            uploadDocument.isPending
                          }
                          onClick={() =>
                            uploadDocument.mutate()
                          }
                          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          {uploadDocument.isPending
                            ? "Uploading..."
                            : "Save Document"}
                        </button>
                      </div>
                    ) : null}

                    {documentsQuery.isLoading ? (
                      <p className="text-xs font-semibold text-slate-400">
                        Loading documents...
                      </p>
                    ) : (
                      documentsQuery.data ||
                      []
                    ).length === 0 ? (
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-6 text-center">
                        <FileText className="mx-auto mb-2 h-6 w-6 text-slate-300" />

                        <p className="text-xs font-bold text-slate-600">
                          No employee documents
                          uploaded yet.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[11px] font-semibold text-slate-400">
                              <th className="pb-3 pr-4">
                                Name
                              </th>

                              <th className="pb-3 pr-4">
                                Type
                              </th>

                              <th className="pb-3 pr-4">
                                Upload Date
                              </th>

                              <th className="pb-3 text-right">
                                Actions
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-50">
                            {(
                              documentsQuery.data ||
                              []
                            ).map(
                              (
                                document: any,
                              ) => (
                                <tr
                                  key={`${document.source}-${document.id}`}
                                  className="text-xs font-semibold text-slate-700"
                                >
                                  <td className="py-3 pr-4">
                                    {display(
                                      document.name,
                                    )}
                                  </td>

                                  <td className="py-3 pr-4">
                                    {display(
                                      document.type,
                                    )}
                                  </td>

                                  <td className="py-3 pr-4">
                                    {formatDate(
                                      document.uploadedAt,
                                    )}
                                  </td>

                                  <td className="py-3">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openDocument(
                                            document,
                                            "preview",
                                          )
                                        }
                                        className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50"
                                        title="Preview"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          openDocument(
                                            document,
                                            "download",
                                          )
                                        }
                                        className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50"
                                        title="Download"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            ) : activeSideTab ===
              "attendance" ? (
              attendanceQuery.isLoading ? (
                <p className="text-xs font-semibold text-slate-400">
                  Loading attendance
                  records...
                </p>
              ) : attendanceRows.length ===
                0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Calendar className="h-6 w-6" />
                  </div>

                  <p className="text-sm font-bold text-slate-700">
                    No attendance records
                    found.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] font-semibold text-slate-400">
                        <th className="pb-3 pr-4">
                          Date
                        </th>

                        <th className="pb-3 pr-4">
                          Check In
                        </th>

                        <th className="pb-3 pr-4">
                          Check Out
                        </th>

                        <th className="pb-3 pr-4">
                          Status
                        </th>

                        <th className="pb-3">
                          Working Hours
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">
                      {visibleAttendanceRows.map(
                        (row: any) => (
                          <tr
                            key={
                              row.date
                            }
                            className="text-xs font-semibold text-slate-700"
                          >
                            <td className="whitespace-nowrap py-3 pr-4">
                              {formatDate(
                                row.date,
                              )}
                            </td>

                            <td className="whitespace-nowrap py-3 pr-4">
                              {formatTime(
                                row.events
                                  ?.checkInAtUtc,
                              )}
                            </td>

                            <td className="whitespace-nowrap py-3 pr-4">
                              {formatTime(
                                row.events
                                  ?.checkOutAtUtc,
                              )}
                            </td>

                            <td className="whitespace-nowrap py-3 pr-4">
                              {attendanceStatus(
                                row,
                              )}
                            </td>

                            <td className="whitespace-nowrap py-3">
                              {formatMinutes(
                                row.calculation
                                  ?.totalWorkedMinutes,
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>

                  <div className="mt-2 flex items-center justify-between border-t border-slate-50 pt-3">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Page{" "}
                      {attendancePage} of{" "}
                      {
                        attendanceTotalPages
                      }
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={
                          attendancePage ===
                          1
                        }
                        onClick={() =>
                          setAttendancePage(
                            (
                              page,
                            ) =>
                              Math.max(
                                1,
                                page -
                                  1,
                              ),
                          )
                        }
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40"
                      >
                        Previous
                      </button>

                      <button
                        type="button"
                        disabled={
                          attendancePage ===
                          attendanceTotalPages
                        }
                        onClick={() =>
                          setAttendancePage(
                            (
                              page,
                            ) =>
                              Math.min(
                                attendanceTotalPages,
                                page +
                                  1,
                              ),
                          )
                        }
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  {activeSideTab ===
                  "performance" ? (
                    <ClipboardList className="h-6 w-6" />
                  ) : (
                    <FileText className="h-6 w-6" />
                  )}
                </div>

                <p className="text-sm font-bold text-slate-700">
                  No records found.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editing ? (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 p-4">
            <motion.form
              initial={{
                opacity: 0,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
              }}
              onSubmit={(event) => {
                event.preventDefault();
                updateProfile.mutate();
              }}
              className="w-full max-w-2xl space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">
                  Edit Profile
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setEditing(false)
                  }
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {error ? (
                <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
                  {error}
                </p>
              ) : null}

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-200 p-3 text-xs font-semibold text-slate-600">
                <Upload className="h-4 w-4 text-blue-600" />

                <span>
                  {file
                    ? file.name
                    : "Upload profile image"}
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) =>
                    setFile(
                      event.target
                        .files?.[0] ||
                        null,
                    )
                  }
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  [
                    "fullName",
                    "Full Name",
                  ],
                  [
                    "phone",
                    "Phone Number",
                  ],
                  [
                    "dateOfBirth",
                    "Date of Birth",
                  ],
                  [
                    "maritalStatus",
                    "Marital Status",
                  ],
                  [
                    "gender",
                    "Gender",
                  ],
                  [
                    "nationality",
                    "Nationality",
                  ],
                  [
                    "address",
                    "Address",
                  ],
                  [
                    "city",
                    "City",
                  ],
                  [
                    "country",
                    "Country",
                  ],
                  [
                    "zipCode",
                    "Zip Code",
                  ],
                ].map(
                  ([
                    key,
                    label,
                  ]) => (
                    <div
                      key={key}
                      className="space-y-1"
                    >
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {label}
                      </label>

                      <input
                        value={
                          (
                            form as any
                          )[key]
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm(
                            (
                              previous,
                            ) => ({
                              ...previous,

                              [key]:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  ),
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setEditing(false)
                  }
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    updateProfile.isPending
                  }
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:bg-slate-300"
                >
                  {updateProfile.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </motion.form>
          </div>
        ) : null}
      </AnimatePresence>

      {targetUserId ? (
        <InitializeProbationDialog
          isOpen={
            probationDialogOpen
          }
          employeeUserId={
            targetUserId
          }
          employeeName={
            fullName ||
            email ||
            "Employee"
          }
          positionId={
            profile?.position
              ?.id ||
            employeeRecord.positionId ||
            null
          }
          positionTitle={
            profile?.position
              ?.title ||
            null
          }
          departmentName={
            profile?.department
              ?.name ||
            null
          }
          currentManagerUserId={
            employeeRecord.managerUserId ||
            profile?.managerUserId ||
            null
          }
          defaultStartDate={
            employeeRecord.hireDate ||
            profile?.joinedAt ||
            null
          }
          onClose={() =>
            setProbationDialogOpen(
              false,
            )
          }
          onSuccess={() => {
            queryClient.invalidateQueries(
              {
                queryKey: [
                  "employee-profile",
                  targetUserId,
                ],
              },
            );
          }}
        />
      ) : null}
    </div>
  );
}
