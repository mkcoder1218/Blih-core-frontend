import React from "react";
import type { EmployeeFormController } from "./types";

const EmployeeFormContext = React.createContext<EmployeeFormController | null>(null);

export function EmployeeFormProvider({
  value,
  children,
}: {
  value: EmployeeFormController;
  children: React.ReactNode;
}) {
  return <EmployeeFormContext.Provider value={value}>{children}</EmployeeFormContext.Provider>;
}

export function useEmployeeForm() {
  const value = React.useContext(EmployeeFormContext);
  if (!value) throw new Error("useEmployeeForm must be used inside EmployeeFormProvider");
  return value;
}
