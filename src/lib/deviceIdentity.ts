const DEVICE_KEY_STORAGE = "blih_trusted_device_key";

export function getDeviceKey() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(DEVICE_KEY_STORAGE);
  if (existing) return existing;

  const key =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(DEVICE_KEY_STORAGE, key);
  return key;
}

export function getDeviceLabel() {
  if (typeof navigator === "undefined") return "My device";

  const platform = navigator.platform || "Device";
  const ua = navigator.userAgent || "";
  const browser =
    ua.includes("Edg/")
      ? "Edge"
      : ua.includes("Chrome/")
        ? "Chrome"
        : ua.includes("Firefox/")
          ? "Firefox"
          : ua.includes("Safari/")
            ? "Safari"
            : "Browser";

  return `${platform} ${browser}`;
}

export function getDeviceUserAgent() {
  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}
