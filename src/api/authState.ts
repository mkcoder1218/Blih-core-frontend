import { useSyncExternalStore } from "react";
import { getAccessToken } from "./storage";

type Listener = () => void;
const listeners = new Set<Listener>();

export function notifyAuthChanged() {
  for (const l of listeners) l();
}

export function subscribeAuth(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return getAccessToken();
}

export function useAccessToken() {
  return useSyncExternalStore(subscribeAuth, getSnapshot, getSnapshot);
}
