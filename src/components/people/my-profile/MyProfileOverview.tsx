import React from "react";
import { InfoField } from "./ProfileCommon";
import { formatDate } from "./utils";

interface MyProfileOverviewProps {
  profile: any;
  settings: any;
  metadata: any;
  employeeRecord: any;
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

export function MyProfileOverview({
  profile,
  settings,
  metadata,
  employeeRecord,
  fullName,
  email,
  phone,
  role,
}: MyProfileOverviewProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-sm font-extrabold text-foreground">Personal information</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Your basic profile details and read-only work information.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
        <InfoField label="Full Name" value={fullName} />
        <InfoField label="Email Address" value={email} />
        <InfoField label="Mobile Number" value={phone} />
        <InfoField
          label="Date of Birth"
          value={formatDate(settings.dateOfBirth || metadata.dateOfBirth)}
        />
        <InfoField label="Marital Status" value={settings.maritalStatus || metadata.maritalStatus} />
        <InfoField label="Gender" value={settings.gender || metadata.gender} />
        <InfoField
          label="Nationality"
          value={settings.nationality || metadata.nationality || metadata.countryOfBirth}
        />
        <InfoField label="Address" value={settings.address || metadata.address} />
        <InfoField label="City" value={settings.city || metadata.city} />
        <InfoField
          label="Country"
          value={settings.country || metadata.country || metadata.countryOfBirth}
        />
        <InfoField label="Zip Code" value={settings.zipCode || metadata.zipCode} />
      </div>

      <div className="my-7 border-t border-border" />

      <div className="mb-5">
        <h2 className="text-sm font-extrabold text-foreground">Employment information</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          These fields are maintained by HR and cannot be edited from My Profile.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
        <InfoField label="Role / Position" value={profile?.position?.title || role} />
        <InfoField label="Department" value={profile?.department?.name} />
        <InfoField label="Work Email" value={profile?.workEmail || email} />
        <InfoField label="Work Phone" value={profile?.workPhone || phone} />
        <InfoField
          label="Joined"
          value={formatDate(employeeRecord?.hireDate || profile?.joinedAt)}
        />
      </div>
    </div>
  );
}
