"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getProject, getProjects, getProjectsSnapshot, PROJECTS_CHANGED_EVENT } from "./storage";

function subscribe(onChange: () => void) {
  window.addEventListener(PROJECTS_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PROJECTS_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
function getSnapshot() {
  return getProjectsSnapshot();
}
const getServerSnapshot = () => null;

/** undefined while hydrating, null when the requested project is missing. */
export function useProject(id: string) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => snapshot === null ? undefined : getProject(id), [id, snapshot]);
}

/** Read the latest project list after hydration and whenever storage changes. */
export function useProjects() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => snapshot === null ? undefined : getProjects(), [snapshot]);
}
