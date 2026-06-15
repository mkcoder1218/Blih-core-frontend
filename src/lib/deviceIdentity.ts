const LEGACY_DEVICE_KEY_STORAGE = "blih_trusted_device_key";
let legacyDeviceKeyForRegistration = "";

function hashDeviceSource(value: string) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return `device-${(hash >>> 0).toString(36)}`;
}

export function getDeviceSignature() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "unknown-device";

  const screenInfo = window.screen
    ? [
        window.screen.width,
        window.screen.height,
        window.screen.colorDepth,
        window.screen.pixelDepth,
      ].join("x")
    : "unknown-screen";

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown-timezone";
  const maxTouchPoints = String(navigator.maxTouchPoints || 0);

  return [
    navigator.platform || "unknown-platform",
    screenInfo,
    timezone,
    maxTouchPoints,
  ].join("|");
}

export function getDeviceKey() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(LEGACY_DEVICE_KEY_STORAGE) || "";
  const key = hashDeviceSource(getDeviceSignature());
  if (existing && existing !== key) legacyDeviceKeyForRegistration = existing;
  window.localStorage.setItem(LEGACY_DEVICE_KEY_STORAGE, key);
  return key;
}

export function getLegacyDeviceKey() {
  return legacyDeviceKeyForRegistration;
}

export function getDeviceLabel() {
  if (typeof navigator === "undefined") return "My device";

  const platform = navigator.platform || "Device";
  if (platform.toLowerCase().includes("win")) return "Windows device";
  if (platform.toLowerCase().includes("mac")) return "Mac device";
  if (platform.toLowerCase().includes("linux")) return "Linux device";
  if (/iphone|ipad|ipod/i.test(platform)) return "iOS device";
  if (/android/i.test(navigator.userAgent || "")) return "Android device";

  return platform;
}

export function getDeviceUserAgent() {
  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}
