import type { Project } from "./storage";
import { STEPS } from "./utils";

export function getProjectProgress(project: Pick<Project, "currentStep" | "isCompleted">): number {
  if (project.isCompleted) return 100;
  return Math.round(((Math.min(STEPS.length, Math.max(1, project.currentStep)) - 1) / STEPS.length) * 100);
}

export function getProjectHref(project: Pick<Project, "id" | "currentStep">): string {
  const step = STEPS[Math.min(STEPS.length, Math.max(1, Math.trunc(project.currentStep))) - 1];
  return `/project/${encodeURIComponent(project.id)}/${step.route}`;
}

export function getDaysUntil(deadline: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return null;
  const [year, month, day] = deadline.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  if (due.getFullYear() !== year || due.getMonth() !== month - 1 || due.getDate() !== day) return null;
  const today = new Date();
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
}
