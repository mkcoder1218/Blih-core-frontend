import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Archive,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Lock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useBusinesses } from "../hooks/useBusinesses";
import { useMe } from "../hooks/useMe";
import {
  useAssignPermissions,
  usePermissions,
  useSeedPermissions,
  type Permission,
} from "../hooks/usePermissions";
import {
  useArchiveRole,
  useCreateRole,
  useDuplicateRole,
  useRoleDetails,
  useRoleUsers,
  useRoles,
  useUpdateRole,
  type CreateRoleInput,
  type Role,
} from "../hooks/useRoles";

type PermissionFilter = "all" | "assigned" | "available";
type PendingNavigation =
  | { type: "role"; id: string | null }
  | { type: "business"; id: string }
  | null;
type RoleDialogMode = "create" | "edit" | "duplicate";

const OPEN_MODULES_KEY = "blih:access-control:open-modules";

function canonicalKeys(keys: string[]) {
  return [...new Set(keys)].sort().join("|");
}

function humanize(value: string) {
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function permissionTitle(permission: Permission) {
  if (permission.title) return permission.title;
  const parts = permission.key.split(".");
  const action = humanize(parts.pop() || permission.action);
  const entity = humanize(parts.slice(1).join(" ") || permission.module);
  return `${action} ${entity}`.trim();
}

function permissionModule(permission: Permission) {
  return permission.moduleTitle || humanize(permission.module);
}

function roleKeyFromName(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

function loadOpenModules() {
  try {
    const raw = window.localStorage.getItem(OPEN_MODULES_KEY);
    if (!raw) return {} as Record<string, boolean>;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, boolean>)
      : {};
  } catch {
    return {} as Record<string, boolean>;
  }
}

function errorMessage(error: unknown) {
  return (
    (error as any)?.response?.data?.message ||
    (error as any)?.response?.data?.error ||
    (error as Error | undefined)?.message ||
    "Something went wrong."
  );
}

function addPermissionWithDependencies(
  target: Set<string>,
  key: string,
  byKey: Map<string, Permission>,
  seen = new Set<string>(),
) {
  if (seen.has(key)) return;
  seen.add(key);
  const permission = byKey.get(key);
  if (!permission) return;
  target.add(key);
  for (const dependency of permission.dependencies || []) {
    addPermissionWithDependencies(target, dependency, byKey, seen);
  }
}

function permissionDependsOn(
  key: string,
  requiredKey: string,
  byKey: Map<string, Permission>,
  seen = new Set<string>(),
): boolean {
  if (seen.has(key)) return false;
  seen.add(key);
  const permission = byKey.get(key);
  if (!permission) return false;
  for (const dependency of permission.dependencies || []) {
    if (dependency === requiredKey) return true;
    if (permissionDependsOn(dependency, requiredKey, byKey, seen)) return true;
  }
  return false;
}

function removePermissionAndDependents(
  target: Set<string>,
  key: string,
  byKey: Map<string, Permission>,
) {
  for (const assignedKey of Array.from(target)) {
    if (
      assignedKey === key ||
      permissionDependsOn(assignedKey, key, byKey)
    ) {
      target.delete(assignedKey);
    }
  }
}

export default function PermissionManagement() {
  const { data: meResponse } = useMe();
  const me = meResponse?.data;
  const isSuperAdmin = Boolean(
    me?.user?.isPlatformSuperAdmin ||
      me?.roles?.includes("PLATFORM_SUPER_ADMIN"),
  );

  const businessesQuery = useBusinesses(isSuperAdmin);
  const businesses = businessesQuery.data?.data?.businesses ?? [];
  const [selectedBusinessId, setSelectedBusinessId] = useState("");

  const rolesQuery = useRoles(
    isSuperAdmin ? selectedBusinessId || undefined : undefined,
  );
  const permissionsQuery = usePermissions();
  const seedPermissions = useSeedPermissions();
  const assignPermissions = useAssignPermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const duplicateRole = useDuplicateRole();
  const archiveRole = useArchiveRole();

  const roles = rolesQuery.data ?? [];
  const allPermissions = permissionsQuery.data ?? [];
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const roleDetailsQuery = useRoleDetails(selectedRoleId);
  const roleDetails = roleDetailsQuery.data;

  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [permissionFilter, setPermissionFilter] =
    useState<PermissionFilter>("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [assignedKeys, setAssignedKeys] = useState<string[]>([]);
  const [originalKeys, setOriginalKeys] = useState<string[]>([]);
  const [openModules, setOpenModules] =
    useState<Record<string, boolean>>(loadOpenModules);
  const [saveState, setSaveState] =
    useState<"idle" | "saved">("idle");
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation>(null);

  const [roleDialogMode, setRoleDialogMode] =
    useState<RoleDialogMode | null>(null);
  const [roleDialogRole, setRoleDialogRole] = useState<Role | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Role | null>(null);
  const [usersRole, setUsersRole] = useState<Role | null>(null);

  const permissionByKey = useMemo(
    () => new Map(allPermissions.map((permission) => [permission.key, permission])),
    [allPermissions],
  );

  const dirty =
    !roleDetails?.isSystemRole &&
    canonicalKeys(assignedKeys) !== canonicalKeys(originalKeys);

  useEffect(() => {
    if (!roleDetails || roleDetails.id !== selectedRoleId) return;
    const keys = (roleDetails.Permissions || []).map((permission) => permission.key);
    setAssignedKeys(keys);
    setOriginalKeys(keys);
    setSaveState("idle");
  }, [selectedRoleId, roleDetails]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    setSelectedRoleId(null);
    setAssignedKeys([]);
    setOriginalKeys([]);
    setPermissionSearch("");
    setPermissionFilter("all");
    setModuleFilter("all");
  }, [selectedBusinessId]);

  const selectedBusiness = businesses.find(
    (business) => business.id === selectedBusinessId,
  );

  const filteredRoles = useMemo(() => {
    const needle = roleSearch.trim().toLowerCase();
    if (!needle) return roles;
    return roles.filter((role) =>
      `${role.name} ${role.key} ${role.description || ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [roleSearch, roles]);

  const systemRoles = filteredRoles.filter((role) => role.isSystemRole);
  const customRoles = filteredRoles.filter((role) => !role.isSystemRole);

  const moduleNames = useMemo(
    () =>
      Array.from(
        new Set(allPermissions.map((permission) => permissionModule(permission))),
      ).sort((a, b) => a.localeCompare(b)),
    [allPermissions],
  );

  const visiblePermissions = useMemo(() => {
    const needle = permissionSearch.trim().toLowerCase();
    return allPermissions.filter((permission) => {
      const moduleName = permissionModule(permission);
      if (moduleFilter !== "all" && moduleName !== moduleFilter) return false;
      if (
        needle &&
        !`${permissionTitle(permission)} ${permission.key} ${permission.description || ""} ${moduleName} ${permission.module}`
          .toLowerCase()
          .includes(needle)
      ) {
        return false;
      }
      const assigned = assignedKeys.includes(permission.key);
      if (permissionFilter === "assigned" && !assigned) return false;
      if (permissionFilter === "available" && assigned) return false;
      return true;
    });
  }, [
    allPermissions,
    assignedKeys,
    moduleFilter,
    permissionFilter,
    permissionSearch,
  ]);

  const permissionGroups = useMemo(() => {
    const grouped = new Map<string, Permission[]>();
    for (const permission of visiblePermissions) {
      const moduleName = permissionModule(permission);
      const existing = grouped.get(moduleName) || [];
      existing.push(permission);
      grouped.set(moduleName, existing);
    }
    return Array.from(grouped.entries()).sort(([, a], [, b]) => {
      const aOrder = Math.min(...a.map((permission) => permission.sortOrder ?? 9999));
      const bOrder = Math.min(...b.map((permission) => permission.sortOrder ?? 9999));
      return aOrder - bOrder;
    });
  }, [visiblePermissions]);

  const moduleTotals = useMemo(() => {
    const totals = new Map<string, Permission[]>();
    for (const permission of allPermissions) {
      const name = permissionModule(permission);
      totals.set(name, [...(totals.get(name) || []), permission]);
    }
    return totals;
  }, [allPermissions]);

  const switchRole = (id: string | null) => {
    if (id === selectedRoleId) return;
    if (dirty) {
      setPendingNavigation({ type: "role", id });
      return;
    }
    setSelectedRoleId(id);
    setNotice(null);
  };

  const switchBusiness = (id: string) => {
    if (id === selectedBusinessId) return;
    if (dirty) {
      setPendingNavigation({ type: "business", id });
      return;
    }
    setSelectedBusinessId(id);
    setNotice(null);
  };

  const discardAndContinue = () => {
    const pending = pendingNavigation;
    setPendingNavigation(null);
    setAssignedKeys(originalKeys);
    if (!pending) return;
    if (pending.type === "role") setSelectedRoleId(pending.id);
    else setSelectedBusinessId(pending.id);
    setNotice(null);
  };

  const togglePermission = (key: string) => {
    if (roleDetails?.isSystemRole) return;
    setSaveState("idle");
    setAssignedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        removePermissionAndDependents(next, key, permissionByKey);
      } else {
        addPermissionWithDependencies(next, key, permissionByKey);
      }
      return Array.from(next);
    });
  };

  const togglePermissionGroup = (permissions: Permission[]) => {
    if (roleDetails?.isSystemRole || permissions.length === 0) return;
    setSaveState("idle");
    setAssignedKeys((current) => {
      const next = new Set(current);
      const allSelected = permissions.every((permission) => next.has(permission.key));
      if (allSelected) {
        for (const permission of permissions) {
          removePermissionAndDependents(next, permission.key, permissionByKey);
        }
      } else {
        for (const permission of permissions) {
          addPermissionWithDependencies(next, permission.key, permissionByKey);
        }
      }
      return Array.from(next);
    });
  };

  const toggleModuleOpen = (moduleName: string) => {
    setOpenModules((current) => {
      const next = {
        ...current,
        [moduleName]: current[moduleName] === false,
      };
      try {
        window.localStorage.setItem(OPEN_MODULES_KEY, JSON.stringify(next));
      } catch {
        // Browser storage is optional; the UI still works without it.
      }
      return next;
    });
  };

  const savePermissions = async () => {
    if (!selectedRoleId || roleDetails?.isSystemRole || !dirty) return;
    setNotice(null);
    try {
      const result = await assignPermissions.mutateAsync({
        roleId: selectedRoleId,
        permissionKeys: assignedKeys,
      });
      const savedKeys = result?.permissionKeys || assignedKeys;
      setAssignedKeys(savedKeys);
      setOriginalKeys(savedKeys);
      setSaveState("saved");
      setNotice({ type: "success", message: "Permission changes saved." });
    } catch (error) {
      setNotice({ type: "error", message: errorMessage(error) });
    }
  };

  const seedDefaults = async () => {
    setNotice(null);
    try {
      await seedPermissions.mutateAsync();
      setNotice({
        type: "success",
        message: "Default permission definitions were seeded successfully.",
      });
    } catch (error) {
      setNotice({ type: "error", message: errorMessage(error) });
    }
  };

  const openCreateRole = () => {
    if (isSuperAdmin && !selectedBusinessId) {
      setNotice({
        type: "info",
        message: "Choose a business before creating a custom role.",
      });
      return;
    }
    setRoleDialogRole(null);
    setRoleDialogMode("create");
  };

  const openEditRole = () => {
    if (!roleDetails || roleDetails.isSystemRole) return;
    setRoleDialogRole(roleDetails);
    setRoleDialogMode("edit");
  };

  const openDuplicateRole = () => {
    if (!roleDetails || roleDetails.isSystemRole) return;
    setRoleDialogRole(roleDetails);
    setRoleDialogMode("duplicate");
  };

  const submitRoleDialog = async (payload: CreateRoleInput) => {
    setNotice(null);
    try {
      let role: Role;
      if (roleDialogMode === "edit" && roleDialogRole) {
        role = await updateRole.mutateAsync({
          id: roleDialogRole.id,
          data: {
            name: payload.name,
            key: payload.key,
            description: payload.description,
          },
        });
      } else if (roleDialogMode === "duplicate" && roleDialogRole) {
        role = await duplicateRole.mutateAsync({
          id: roleDialogRole.id,
          data: {
            ...payload,
            businessId: isSuperAdmin ? selectedBusinessId || undefined : undefined,
          },
        });
      } else {
        role = await createRole.mutateAsync({
          ...payload,
          businessId: isSuperAdmin ? selectedBusinessId || undefined : undefined,
        });
      }
      setRoleDialogMode(null);
      setRoleDialogRole(null);
      setSelectedRoleId(role.id);
      setNotice({
        type: "success",
        message:
          roleDialogMode === "edit"
            ? "Role updated."
            : roleDialogMode === "duplicate"
              ? "Role duplicated."
              : "Role created.",
      });
    } catch (error) {
      throw error;
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget || archiveTarget.isSystemRole) return;
    setNotice(null);
    try {
      await archiveRole.mutateAsync(archiveTarget.id);
      if (selectedRoleId === archiveTarget.id) setSelectedRoleId(null);
      setArchiveTarget(null);
      setNotice({ type: "success", message: "Custom role archived." });
    } catch (error) {
      setNotice({ type: "error", message: errorMessage(error) });
    }
  };

  const roleBusy =
    createRole.isPending || updateRole.isPending || duplicateRole.isPending;
  const selectedAssignedCount = assignedKeys.length;

  return (
    <main className="h-full overflow-y-auto bg-muted/20 p-3 sm:p-4 lg:p-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  Access Control
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Create custom roles and control exactly which parts of Blih they can use.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isSuperAdmin ? (
                <label className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={selectedBusinessId}
                    onChange={(event) => switchBusiness(event.currentTarget.value)}
                    className="h-9 min-w-52 appearance-none rounded-md border border-input bg-background py-1 pl-9 pr-9 text-xs font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    aria-label="Business filter"
                  >
                    <option value="">All Businesses</option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </label>
              ) : null}

              <details className="relative">
                <summary className="inline-flex h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent [&::-webkit-details-marker]:hidden">
                  <MoreHorizontal className="h-4 w-4" />
                  Actions
                </summary>
                <div className="absolute right-0 z-40 mt-2 w-60 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
                  <button
                    type="button"
                    onClick={() => void seedDefaults()}
                    disabled={seedPermissions.isPending}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium hover:bg-accent disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${seedPermissions.isPending ? "animate-spin" : ""}`}
                    />
                    Seed Default Permissions
                  </button>
                </div>
              </details>

              <Button
                type="button"
                size="sm"
                onClick={openCreateRole}
                disabled={isSuperAdmin && !selectedBusinessId}
              >
                <Plus className="h-4 w-4" />
                New Role
              </Button>
            </div>
          </div>

          {notice ? (
            <div
              className={`mt-4 rounded-md border px-3 py-2 text-xs ${
                notice.type === "error"
                  ? "border-destructive/25 bg-destructive/5 text-destructive"
                  : notice.type === "success"
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-primary/20 bg-primary/5 text-foreground"
              }`}
            >
              {notice.message}
            </div>
          ) : null}
        </section>

        <div className="md:hidden">
          <label className="grid gap-1.5 rounded-xl border border-border bg-card p-3">
            <span className="text-[11px] font-medium text-muted-foreground">
              Role
            </span>
            <select
              value={selectedRoleId || ""}
              onChange={(event) => switchRole(event.currentTarget.value || null)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            >
              <option value="">Choose a role</option>
              {systemRoles.length ? (
                <optgroup label="System Roles">
                  {systemRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} · {role.userCount ?? 0} users
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {customRoles.length ? (
                <optgroup label="Custom Roles">
                  {customRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} · {role.userCount ?? 0} users
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </label>
        </div>

        <div className="grid min-h-[680px] gap-4 md:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="hidden min-h-0 overflow-hidden rounded-xl border border-border bg-card md:flex md:flex-col">
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={roleSearch}
                  onChange={(event) => setRoleSearch(event.currentTarget.value)}
                  placeholder="Search roles..."
                  className="h-9 pl-9"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <RoleSection
                title="System Roles"
                roles={systemRoles}
                selectedRoleId={selectedRoleId}
                onSelect={switchRole}
                onUsers={setUsersRole}
              />
              <RoleSection
                title="Custom Roles"
                roles={customRoles}
                selectedRoleId={selectedRoleId}
                onSelect={switchRole}
                onUsers={setUsersRole}
              />
              {!rolesQuery.isLoading && !filteredRoles.length ? (
                <div className="px-3 py-10 text-center text-xs text-muted-foreground">
                  No roles match your search.
                </div>
              ) : null}
              {rolesQuery.isLoading ? (
                <div className="grid gap-2 p-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-16 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
            {!selectedRoleId ? (
              <div className="flex h-full min-h-[540px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-foreground">
                  Choose a role
                </h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Select a role to review its assigned permissions. System roles are read-only.
                </p>
              </div>
            ) : roleDetailsQuery.isLoading || permissionsQuery.isLoading ? (
              <div className="grid gap-3 p-5">
                <div className="h-16 animate-pulse rounded-lg bg-muted" />
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : !roleDetails ? (
              <div className="p-8 text-sm text-destructive">
                The selected role could not be loaded.
              </div>
            ) : (
              <>
                <div className="border-b border-border p-4 sm:p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          roleDetails.isSystemRole
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <Lock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-base font-semibold text-foreground">
                            {roleDetails.name}
                          </h2>
                          <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {roleDetails.isSystemRole ? "System" : "Custom"}
                          </span>
                        </div>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {roleDetails.key}
                        </p>
                        <button
                          type="button"
                          className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                          onClick={() => setUsersRole(roleDetails)}
                        >
                          <Users className="h-3.5 w-3.5" />
                          {roleDetails.userCount ?? 0} assigned users
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {selectedAssignedCount}
                        </span>{" "}
                        / {allPermissions.length} assigned
                      </div>

                      {!roleDetails.isSystemRole ? (
                        <details className="relative">
                          <summary className="inline-flex h-8 cursor-pointer list-none items-center justify-center rounded-md border border-input bg-background px-2.5 text-xs font-medium hover:bg-accent [&::-webkit-details-marker]:hidden">
                            <MoreHorizontal className="h-4 w-4" />
                          </summary>
                          <div className="absolute right-0 z-40 mt-2 w-44 rounded-lg border border-border bg-popover p-1.5 shadow-lg">
                            <button
                              type="button"
                              onClick={openEditRole}
                              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs hover:bg-accent"
                            >
                              <Edit3 className="h-4 w-4" />
                              Edit Role
                            </button>
                            <button
                              type="button"
                              onClick={openDuplicateRole}
                              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs hover:bg-accent"
                            >
                              <Copy className="h-4 w-4" />
                              Duplicate Role
                            </button>
                            <button
                              type="button"
                              onClick={() => setArchiveTarget(roleDetails)}
                              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-destructive hover:bg-destructive/10"
                            >
                              <Archive className="h-4 w-4" />
                              Archive Role
                            </button>
                          </div>
                        </details>
                      ) : null}

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void savePermissions()}
                        disabled={
                          roleDetails.isSystemRole ||
                          !dirty ||
                          assignPermissions.isPending
                        }
                      >
                        {assignPermissions.isPending
                          ? "Saving..."
                          : saveState === "saved" && !dirty
                            ? "Saved ✓"
                            : "Save Changes"}
                      </Button>
                    </div>
                  </div>

                  {roleDetails.description ? (
                    <p className="mt-3 max-w-3xl text-xs leading-5 text-muted-foreground">
                      {roleDetails.description}
                    </p>
                  ) : null}

                  {roleDetails.isSystemRole ? (
                    <div className="mt-3 flex gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        This is a protected system role. Its permission set is read-only here and can only be maintained by seeded system defaults.
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="border-b border-border p-3 sm:p-4">
                  <div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_190px_auto]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={permissionSearch}
                        onChange={(event) =>
                          setPermissionSearch(event.currentTarget.value)
                        }
                        placeholder="Search title, key, description or module..."
                        className="h-9 pl-9"
                      />
                    </div>

                    <select
                      value={moduleFilter}
                      onChange={(event) => setModuleFilter(event.currentTarget.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                      aria-label="Module filter"
                    >
                      <option value="all">All Modules</option>
                      {moduleNames.map((moduleName) => (
                        <option key={moduleName} value={moduleName}>
                          {moduleName}
                        </option>
                      ))}
                    </select>

                    <div className="inline-flex h-9 rounded-md border border-border bg-muted/30 p-0.5">
                      {(["all", "assigned", "available"] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setPermissionFilter(filter)}
                          className={`rounded px-3 text-[11px] font-medium capitalize transition-colors ${
                            permissionFilter === filter
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 bg-muted/10 p-3 sm:p-4">
                  {permissionGroups.length ? (
                    permissionGroups.map(([moduleName, permissions]) => {
                      const modulePermissions = moduleTotals.get(moduleName) || [];
                      const moduleAssigned = modulePermissions.filter((permission) =>
                        assignedKeys.includes(permission.key),
                      ).length;
                      const visibleAllSelected = permissions.every((permission) =>
                        assignedKeys.includes(permission.key),
                      );
                      const isOpen = openModules[moduleName] !== false;

                      return (
                        <section
                          key={moduleName}
                          className="overflow-hidden rounded-lg border border-border bg-card"
                        >
                          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => toggleModuleOpen(moduleName)}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            >
                              <ChevronRight
                                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                              />
                              <span className="truncate text-xs font-semibold text-foreground">
                                {moduleName}
                              </span>
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {moduleAssigned} / {modulePermissions.length}
                              </span>
                            </button>

                            <button
                              type="button"
                              disabled={roleDetails.isSystemRole}
                              onClick={() => togglePermissionGroup(permissions)}
                              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-default disabled:opacity-50"
                            >
                              <span
                                className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                                  visibleAllSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input bg-background"
                                }`}
                              >
                                {visibleAllSelected ? <Check className="h-2.5 w-2.5" /> : null}
                              </span>
                              {visibleAllSelected ? "Deselect visible" : "Select visible"}
                            </button>
                          </div>

                          {isOpen ? (
                            <div className="grid gap-px bg-border sm:grid-cols-2 2xl:grid-cols-3">
                              {permissions.map((permission) => {
                                const checked = assignedKeys.includes(permission.key);
                                return (
                                  <PermissionRow
                                    key={permission.id}
                                    permission={permission}
                                    checked={checked}
                                    disabled={roleDetails.isSystemRole}
                                    onToggle={() => togglePermission(permission.key)}
                                  />
                                );
                              })}
                            </div>
                          ) : null}
                        </section>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
                      No permissions match the current filters.
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <RoleEditorDialog
        open={roleDialogMode !== null}
        mode={roleDialogMode || "create"}
        role={roleDialogRole}
        roles={roles}
        busy={roleBusy}
        onOpenChange={(open) => {
          if (!open && !roleBusy) {
            setRoleDialogMode(null);
            setRoleDialogRole(null);
          }
        }}
        onSubmit={submitRoleDialog}
      />

      <RoleUsersDialog
        open={Boolean(usersRole)}
        role={usersRole}
        businessId={isSuperAdmin ? selectedBusinessId || undefined : undefined}
        onOpenChange={(open) => {
          if (!open) setUsersRole(null);
        }}
      />

      <Dialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open && !archiveRole.isPending) setArchiveTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive role?</DialogTitle>
            <DialogDescription>
              {archiveTarget?.name} will disappear from active roles. Existing role history is preserved.
              {archiveTarget?.userCount
                ? ` ${archiveTarget.userCount} user${archiveTarget.userCount === 1 ? " is" : "s are"} currently assigned.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setArchiveTarget(null)}
              disabled={archiveRole.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmArchive()}
              disabled={archiveRole.isPending}
            >
              {archiveRole.isPending ? "Archiving..." : "Archive Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingNavigation)}
        onOpenChange={(open) => {
          if (!open) setPendingNavigation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved permission changes</DialogTitle>
            <DialogDescription>
              You changed this custom role but have not saved it yet. Discard the changes before switching?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingNavigation(null)}
            >
              Stay
            </Button>
            <Button type="button" onClick={discardAndContinue}>
              Discard and Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function RoleSection({
  title,
  roles,
  selectedRoleId,
  onSelect,
  onUsers,
}: {
  title: string;
  roles: Role[];
  selectedRoleId: string | null;
  onSelect: (id: string) => void;
  onUsers: (role: Role) => void;
}) {
  if (!roles.length) return null;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between px-2 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <span className="text-[10px] text-muted-foreground">{roles.length}</span>
      </div>
      <div className="grid gap-1">
        {roles.map((role) => {
          const selected = selectedRoleId === role.id;
          return (
            <div
              key={role.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(role.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelect(role.id);
              }}
              className={`group flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2.5 transition-colors ${
                selected
                  ? "border-primary/35 bg-primary/8"
                  : "border-transparent hover:border-border hover:bg-muted/40"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {role.name}
                </p>
                <p className="truncate font-mono text-[9px] text-muted-foreground">
                  {role.key}
                </p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onUsers(role);
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-[9px] font-medium text-muted-foreground hover:bg-background hover:text-foreground"
                title="View assigned users"
              >
                <Users className="h-3 w-3" />
                {role.userCount ?? 0}
              </button>
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 ${
                  selected ? "text-primary" : "text-muted-foreground/50"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PermissionRow({
  permission,
  checked,
  disabled,
  onToggle,
}: {
  permission: Permission;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) onToggle();
      }}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onToggle();
        }
      }}
      className={`min-w-0 bg-card p-3 transition-colors ${
        disabled ? "cursor-default" : "cursor-pointer hover:bg-muted/35"
      } ${checked ? "bg-primary/[0.035]" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background"
          } ${disabled ? "opacity-70" : ""}`}
        >
          {checked ? <Check className="h-3 w-3" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-4 text-foreground">
            {permissionTitle(permission)}
          </p>
          <p className="mt-0.5 truncate font-mono text-[9px] text-muted-foreground">
            {permission.key}
          </p>
          {permission.description ? (
            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">
              {permission.description}
            </p>
          ) : null}
          {(permission.dependencies?.length || 0) > 0 ? (
            <p className="mt-1 text-[9px] font-medium text-muted-foreground/80">
              Requires {permission.dependencies?.length} permission
              {permission.dependencies?.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RoleEditorDialog({
  open,
  mode,
  role,
  roles,
  busy,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: RoleDialogMode;
  role: Role | null;
  roles: Role[];
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateRoleInput) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [copyFromRoleId, setCopyFromRoleId] = useState("");
  const [keyEdited, setKeyEdited] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && role) {
      setName(role.name);
      setKey(role.key);
      setDescription(role.description || "");
      setCopyFromRoleId("");
      setKeyEdited(true);
    } else if (mode === "duplicate" && role) {
      const duplicateName = `Copy of ${role.name}`;
      setName(duplicateName);
      setKey(roleKeyFromName(duplicateName));
      setDescription(role.description || "");
      setCopyFromRoleId("");
      setKeyEdited(false);
    } else {
      setName("");
      setKey("");
      setDescription("");
      setCopyFromRoleId("");
      setKeyEdited(false);
    }
    setSubmitError("");
  }, [mode, open, role]);

  const changeName = (value: string) => {
    setName(value);
    if (!keyEdited) setKey(roleKeyFromName(value));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !key.trim()) return;
    setSubmitError("");
    try {
      await onSubmit({
        name: name.trim(),
        key: roleKeyFromName(key),
        description: description.trim() || null,
        copyFromRoleId:
          mode === "create" && copyFromRoleId ? copyFromRoleId : undefined,
      });
    } catch (error) {
      setSubmitError(errorMessage(error));
    }
  };

  const title =
    mode === "edit"
      ? "Edit Custom Role"
      : mode === "duplicate"
        ? "Duplicate Custom Role"
        : "Create Custom Role";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Create a reusable business role. You can start empty or copy an existing role's permissions."
                : mode === "duplicate"
                  ? "Create a new custom role with the same permissions as this role."
                  : "Update the custom role's identity. Permission changes are managed on the Access Control page."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-5">
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-foreground">Role Name</span>
              <Input
                value={name}
                onChange={(event) => changeName(event.currentTarget.value)}
                placeholder="e.g. Operations Coordinator"
                maxLength={120}
                autoFocus
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-foreground">Role Key</span>
              <Input
                value={key}
                onChange={(event) => {
                  setKeyEdited(true);
                  setKey(roleKeyFromName(event.currentTarget.value));
                }}
                placeholder="OPERATIONS_COORDINATOR"
                maxLength={120}
                className="font-mono"
              />
              <span className="text-[10px] text-muted-foreground">
                Uppercase letters, numbers and underscores only.
              </span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-foreground">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
                placeholder="Describe what this role is responsible for..."
                maxLength={255}
                rows={3}
                className="resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </label>

            {mode === "create" ? (
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-foreground">
                  Copy Permissions From
                </span>
                <select
                  value={copyFromRoleId}
                  onChange={(event) => setCopyFromRoleId(event.currentTarget.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                >
                  <option value="">Start with no permissions</option>
                  {roles.map((sourceRole) => (
                    <option key={sourceRole.id} value={sourceRole.id}>
                      {sourceRole.name} {sourceRole.isSystemRole ? "(System)" : "(Custom)"}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {submitError ? (
              <div className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {submitError}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || !name.trim() || !key.trim()}
            >
              {busy
                ? "Saving..."
                : mode === "edit"
                  ? "Save Role"
                  : mode === "duplicate"
                    ? "Duplicate Role"
                    : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoleUsersDialog({
  open,
  role,
  businessId,
  onOpenChange,
}: {
  open: boolean;
  role: Role | null;
  businessId?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [role?.id]);

  useEffect(() => setPage(1), [deferredSearch]);

  const usersQuery = useRoleUsers(
    role?.id || null,
    {
      page,
      size: 10,
      search: deferredSearch || undefined,
      businessId,
    },
    open,
  );
  const data = usersQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{role?.name || "Role"} Users</DialogTitle>
          <DialogDescription>
            People currently assigned to this role. Results are paginated.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Search name or email..."
              className="pl-9"
            />
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            {usersQuery.isLoading ? (
              <div className="grid gap-2 p-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-11 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : usersQuery.isError ? (
              <div className="p-4 text-xs text-destructive">
                {errorMessage(usersQuery.error)}
              </div>
            ) : data?.rows?.length ? (
              <div className="divide-y divide-border">
                {data.rows.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {user.fullName}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                      {humanize(user.status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No users found for this role.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] text-muted-foreground">
              {data?.count ?? 0} user{data?.count === 1 ? "" : "s"} · Page{" "}
              {data?.page ?? page} of {data?.pages ?? 1}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={(data?.page ?? page) <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={(data?.page ?? page) >= (data?.pages ?? 1)}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
