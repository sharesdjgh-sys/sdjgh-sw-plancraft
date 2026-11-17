"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getProject, PROJECTS_CHANGED_EVENT } from "./storage";

function subscribe(onChange: () => void) {
  window.addEventListener(PROJECTS_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PROJECTS_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
function getSnapshot() {
  try { return localStorage.getItem("plancraft_projects") ?? "[]"; } catch { return "[]"; }
}
const getServerSnapshot = () => null;

/** undefined while hydrating, null when the requested project is missing. */
export function useProject(id: string) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => snapshot === null ? undefined : getProject(id), [id, snapshot]);
}
