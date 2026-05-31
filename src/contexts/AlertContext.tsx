import React, { createContext, useCallback, useContext, useState } from "react";

type AlertType = "success" | "info" | "error";

interface AlertContextValue {
  showAlert: (title: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextValue>({
  showAlert: () => {},
});

export function useAlert() {
  return useContext(AlertContext);
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    type: AlertType;
  }>({ show: false, title: "", type: "success" });

  const showAlert = useCallback((title: string, type: AlertType = "success") => {
    setNotification({ show: true, title, type });
    setTimeout(() => setNotification((prev) => ({ ...prev, show: false })), 4500);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {notification.show && (
        <div
          className={`fixed top-20 right-4 sm:right-8 z-[300] px-4 py-3.5 rounded-xl flex items-center gap-3 max-w-[calc(100vw-2rem)] shadow-xl border text-white text-xs font-bold font-sans
            ${notification.type === "success" ? "bg-slate-900 border-slate-800" : notification.type === "error" ? "bg-rose-600 border-rose-700" : "bg-blue-600 border-blue-700"}`}
        >
          {notification.title}
        </div>
      )}
    </AlertContext.Provider>
  );
}
