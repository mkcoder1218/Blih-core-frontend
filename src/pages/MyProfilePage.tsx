import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  Mail,
  Pencil,
  User,
} from "lucide-react";
import { api } from "../api/client";
import { useLegacyUser } from "../api/legacyUserStore";
import { BasicProfileEditModal } from "../components/people/my-profile/BasicProfileEditModal";
import { MyProfileAttendance } from "../components/people/my-profile/MyProfileAttendance";
import { MyProfileLeave } from "../components/people/my-profile/MyProfileLeave";
import { MyProfileOverview } from "../components/people/my-profile/MyProfileOverview";
import { EmptyState } from "../components/people/my-profile/ProfileCommon";
import type {
  AttendancePage,
  BasicProfileForm,
  LeaveBalance,
  LeavePage,
  SideTab,
} from "../components/people/my-profile/types";
import {
  display,
  imageSrc,
  initials,
  PROFILE_PAGE_SIZE,
  unwrap,
} from "../components/people/my-profile/utils";

export default function MyProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const legacyUser = useLegacyUser() || undefined;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<SideTab>("profile");
  const [editing, setEditing] = useState(false);
  const [attendancePage, setAttendancePage] = useState(1);
  const [leavePage, setLeavePage] = useState(1);

  const fallback = location.pathname.startsWith("/super-admin")
    ? "/super-admin/businesses"
    : location.pathname.startsWith("/business-admin")
      ? "/business-admin/recruitment"
      : location.pathname.startsWith("/hr-manager")
        ? "/hr-manager/recruitment"
        : "/employee/recruitment";

  const profileQuery = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const response = await api.get("/api/v1/profiles/me");
      return response.data?.profile || response.data?.data?.profile || response.data?.data;
    },
  });

  const profile = profileQuery.data || {};
  const settings = profile?.settings || {};
  const profileUser = profile?.User || profile?.user || {};
  const employeeRecord = profile?.employeeRecord || {};
  const metadata = employeeRecord?.metadata || {};

  const fullName = settings.fullName || profileUser.fullName || legacyUser?.name || "";
  const email = settings.email || profile?.workEmail || profileUser.email || legacyUser?.email || "";
  const phone = settings.phone || profile?.workPhone || profileUser.phone || "";
  const role = profile?.position?.title || legacyUser?.role || profile?.department?.name || "Employee";
  const avatarUrl = imageSrc(settings.profileImageUrl);

  const editDefaults: BasicProfileForm = useMemo(
    () => ({
      fullName: fullName || "",
      phone: phone || "",
      dateOfBirth: settings.dateOfBirth || metadata.dateOfBirth || "",
      maritalStatus: settings.maritalStatus || metadata.maritalStatus || "",
      gender: settings.gender || metadata.gender || "",
      nationality:
        settings.nationality || metadata.nationality || metadata.countryOfBirth || "",
      address: settings.address || metadata.address || "",
      city: settings.city || metadata.city || "",
      country: settings.country || metadata.country || metadata.countryOfBirth || "",
      zipCode: settings.zipCode || metadata.zipCode || "",
    }),
    [fullName, phone, settings, metadata],
  );

  const updateProfile = useMutation({
    mutationFn: async ({ value, image }: { value: BasicProfileForm; image: File | null }) => {
      const body = new FormData();
      (Object.keys(value) as Array<keyof BasicProfileForm>).forEach((key) => {
        body.append(key, value[key] || "");
      });
      if (image) body.append("profileImage", image);

      const response = await api.patch("/api/v1/profiles/me", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data?.profile || response.data?.data?.profile || response.data?.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["my-profile"], updated);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });

  const attendanceQuery = useQuery<AttendancePage>({
    queryKey: ["my-profile", "attendance", attendancePage],
    enabled: activeTab === "attendance",
    queryFn: async () => {
      const response = await api.get("/api/v1/attendance/me/history", {
        params: {
          page: attendancePage,
          size: PROFILE_PAGE_SIZE,
          sortBy: "date",
          sortOrder: "desc",
        },
      });
      const data = unwrap<any>(response);
      return {
        rows: Array.isArray(data?.rows) ? data.rows : [],
        count: Number(data?.count || 0),
        page: Number(data?.page || attendancePage),
        size: Number(data?.size || PROFILE_PAGE_SIZE),
      };
    },
  });

  const leaveQuery = useQuery<LeavePage>({
    queryKey: ["my-profile", "leave", leavePage],
    enabled: activeTab === "leave",
    queryFn: async () => {
      const response = await api.get("/api/v1/leave-requests/mine", {
        params: { page: leavePage, size: PROFILE_PAGE_SIZE },
      });
      const data = response.data || {};
      return {
        rows: Array.isArray(data.rows) ? data.rows : [],
        total: Number(data.total || data.count || 0),
        page: Number(data.page || leavePage),
        size: Number(data.size || PROFILE_PAGE_SIZE),
        totalPages: Number(data.totalPages || data.pages || 1),
      };
    },
  });

  const balancesQuery = useQuery<LeaveBalance[]>({
    queryKey: ["my-profile", "leave-balances"],
    enabled: activeTab === "leave",
    queryFn: async () => {
      const response = await api.get("/api/v1/leave-requests/my-balances");
      return Array.isArray(response.data?.balances) ? response.data.balances : [];
    },
  });

  const attendancePages = Math.max(
    1,
    Math.ceil(
      (attendanceQuery.data?.count || 0) /
        (attendanceQuery.data?.size || PROFILE_PAGE_SIZE),
    ),
  );
  const leavePages = Math.max(1, leaveQuery.data?.totalPages || 1);

  const sideNavItems: Array<{ id: SideTab; label: string; icon: React.ElementType }> = [
    { id: "profile", label: "Profile", icon: User },
    { id: "attendance", label: "Attendance", icon: CalendarDays },
    { id: "performance", label: "Performance", icon: ClipboardList },
    { id: "leave", label: "Leave", icon: FileText },
  ];

  return (
    <div className="min-h-full bg-background p-4 text-foreground sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <button
          type="button"
          onClick={() => navigate(fallback)}
          className="inline-flex items-center gap-2 text-sm font-bold text-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>My Profile</span>
        </button>
        <p className="-mt-5 ml-6 text-xs text-muted-foreground">Current employee information</p>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <header className="flex flex-col gap-5 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-primary/5 text-lg font-extrabold text-primary">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName || "Profile"} className="h-full w-full object-cover" />
                ) : (
                  initials(fullName)
                )}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-extrabold text-foreground">
                  {display(fullName)}
                </h1>
                <p className="mt-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ClipboardList className="h-3.5 w-3.5" />
                  {display(role)}
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {display(email)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </button>
          </header>

          <div className="grid min-h-[430px] grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)]">
            <aside className="border-b border-border p-3 md:border-b-0 md:border-r">
              <nav className="flex gap-2 overflow-x-auto md:flex-col">
                {sideNavItems.map(({ id, label, icon: Icon }) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => {
                      setActiveTab(id);
                      if (id === "attendance") setAttendancePage(1);
                      if (id === "leave") setLeavePage(1);
                    }}
                    className={`inline-flex min-w-fit items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition md:w-full ${
                      activeTab === id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </nav>
            </aside>

            <main className="min-w-0">
              {profileQuery.isLoading ? (
                <EmptyState
                  icon={User}
                  title="Loading profile"
                  description="Getting your current employee information."
                />
              ) : profileQuery.isError ? (
                <EmptyState
                  icon={AlertCircle}
                  title="Could not load profile"
                  description={
                    (profileQuery.error as any)?.response?.data?.message ||
                    "Please refresh and try again."
                  }
                />
              ) : activeTab === "profile" ? (
                <MyProfileOverview
                  profile={profile}
                  settings={settings}
                  metadata={metadata}
                  employeeRecord={employeeRecord}
                  fullName={fullName}
                  email={email}
                  phone={phone}
                  role={role}
                />
              ) : activeTab === "attendance" ? (
                <MyProfileAttendance
                  data={attendanceQuery.data}
                  loading={attendanceQuery.isLoading}
                  error={attendanceQuery.error}
                  page={attendancePage}
                  pages={attendancePages}
                  onPageChange={setAttendancePage}
                />
              ) : activeTab === "leave" ? (
                <MyProfileLeave
                  data={leaveQuery.data}
                  balances={balancesQuery.data || []}
                  loading={leaveQuery.isLoading}
                  balancesLoading={balancesQuery.isLoading}
                  error={leaveQuery.error}
                  page={leavePage}
                  pages={leavePages}
                  onPageChange={setLeavePage}
                />
              ) : (
                <EmptyState
                  icon={ClipboardList}
                  title="Performance"
                  description="Performance information is managed by the Performance and OKR modules. This profile tab remains read-only."
                />
              )}
            </main>
          </div>
        </section>
      </div>

      <BasicProfileEditModal
        open={editing}
        initialValue={editDefaults}
        currentImageUrl={avatarUrl}
        onClose={() => setEditing(false)}
        onSave={async (value, image) => {
          await updateProfile.mutateAsync({ value, image });
        }}
      />
    </div>
  );
}
