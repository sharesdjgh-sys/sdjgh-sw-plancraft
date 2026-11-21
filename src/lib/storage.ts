import { deleteCampusProject, getCampusEpoch, putCampusProject, type ServerProjectRecord } from "./campusClient";

export type Character = {
  name: string;
  role: string;
  age: string;
  appearance: string;
  personality: string;
  backstory: string;
};

export type Cut = { angle: string; description: string; dialogue: string; soundEffect: string };
export type Episode = {
  episodeNumber: number;
  title: string;
  synopsis: string;
  cuts: Cut[];
  script: string;
  isCompleted: boolean;
};
export type ChatMessage = { role: "user" | "assistant"; content: string };
export type UserType = "student" | "general";
export type Project = {
  id: string;
  title: string;
  author: string;
  genre: string;
  targetCompetition: string;
  deadline: string;
  currentStep: number;
  isCompleted: boolean;
  authorNote: string;
  proposalScript: string;
  createdAt: string;
  updatedAt?: string;
  userType: UserType;
  ideaChat?: ChatMessage[];
  ideaStage?: 0 | 1 | 2;
  mentorChats?: Partial<Record<"story" | "character" | "panel" | "script" | "completion", ChatMessage[]>>;
  reviewChecks?: Record<string, boolean>;
  story: { logline: string; theme: string; setting: string; plotOutline: string; totalEpisodes: string };
  characters: Character[];
  episodes: Episode[];
};

const KEY = "plancraft_projects";
export const PROJECTS_CHANGED_EVENT = "plancraft:projects-changed";
type StoredProject = Omit<Project, "userType"> & { userType?: UserType };

let serverProjects: Project[] | null = null;
let serverVersion = 0;
const revisions = new Map<string, number>();
const snapshots = new Map<string, string>();
const dirty = new Set<string>();
const errors = new Map<string, string>();
let pending: Promise<void> | null = null;

function changed(): void {
  serverVersion += 1;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
}

function normalizeProject(project: StoredProject): Project {
  return {
    ...project,
    currentStep: Math.min(6, Math.max(1, Math.trunc(project.currentStep || 1))),
    updatedAt: project.updatedAt ?? project.createdAt,
    authorNote: project.authorNote ?? "",
    proposalScript: project.proposalScript ?? "",
    userType: project.userType === "general" ? "general" : "student",
  };
}

export function getProjectsSnapshot(): string {
  if (serverProjects !== null) return `server:${serverVersion}`;
  try { return localStorage.getItem(KEY) ?? "[]"; } catch { return "[]"; }
}

export function getBrowserProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]") as StoredProject[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeProject);
  } catch { return []; }
}

export function activateServerProjects(records: ServerProjectRecord[]): void {
  serverProjects = records.map(record => normalizeProject(record.project));
  revisions.clear();
  snapshots.clear();
  dirty.clear();
  errors.clear();
  records.forEach(record => {
    revisions.set(record.project.id, record.revision);
    snapshots.set(record.project.id, JSON.stringify(normalizeProject(record.project)));
  });
  changed();
}

export function deactivateServerProjects(): void {
  serverProjects = null;
  revisions.clear();
  snapshots.clear();
  dirty.clear();
  errors.clear();
  changed();
}

export function getServerSaveError(): string | null { return errors.values().next().value ?? null; }
export function isServerStorageActive(): boolean { return serverProjects !== null; }

function pumpWrites(): Promise<void> {
  if (pending) return pending;
  const session = getCampusEpoch();
  pending = (async () => {
    while (dirty.size && session === getCampusEpoch() && serverProjects !== null) {
      const id = dirty.values().next().value as string;
      dirty.delete(id);
      const project = serverProjects.find(item => item.id === id);
      try {
        if (project) revisions.set(id, await putCampusProject(project, revisions.get(id) ?? 0));
        else if (revisions.has(id)) {
          await deleteCampusProject(id, revisions.get(id)!);
          revisions.delete(id);
        }
        errors.delete(id);
      } catch (error) {
        if (session !== getCampusEpoch()) break;
        errors.set(id, error instanceof Error ? error.message : "서버 저장에 실패했어요.");
      }
      changed();
    }
  })().finally(() => {
    pending = null;
    if (dirty.size && serverProjects !== null) void pumpWrites();
  });
  return pending;
}

export async function flushServerWrites(): Promise<void> {
  while (pending || dirty.size) await (pending ?? pumpWrites());
  const error = getServerSaveError();
  if (error) throw new Error(error);
}

export async function retryServerWrites(): Promise<void> {
  for (const id of errors.keys()) dirty.add(id);
  errors.clear();
  await flushServerWrites();
}

export function getProjects(): Project[] {
  if (serverProjects !== null) return serverProjects;
  return getBrowserProjects();
}

export function saveProjects(projects: Project[]): void {
  if (serverProjects !== null) {
    const next = new Map(projects.map(project => [project.id, JSON.stringify(project)]));
    serverProjects = projects;
    for (const id of new Set([...snapshots.keys(), ...next.keys()])) {
      if (snapshots.get(id) !== next.get(id)) dirty.add(id);
    }
    snapshots.clear();
    next.forEach((value, id) => snapshots.set(id, value));
    changed();
    void pumpWrites();
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(projects));
  changed();
}

export function getProject(id: string): Project | null {
  return getProjects().find((p) => p.id === id) ?? null;
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx !== -1) {
    projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
    saveProjects(projects);
  }
}

export function createProject(data: {
  title: string; author: string; genre: string; targetCompetition: string; deadline: string; userType: UserType;
}): Project {
  const now = new Date().toISOString();
  const project: Project = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    currentStep: 1,
    isCompleted: false,
    authorNote: "",
    proposalScript: "",
    story: { logline: "", theme: "", setting: "", plotOutline: "", totalEpisodes: "1" },
    characters: [],
    episodes: [{ episodeNumber: 1, title: "", synopsis: "", cuts: [], script: "", isCompleted: false }],
  };
  saveProjects([project, ...getProjects()]);
  return project;
}

export function deleteProject(id: string): void {
  saveProjects(getProjects().filter((p) => p.id !== id));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function hasStrings(value: unknown, keys: string[]): boolean {
  return isRecord(value) && keys.every((key) => typeof value[key] === "string");
}

/** Validate every entry before importing so a malformed backup cannot replace existing work. */
export function isProject(value: unknown): value is Project {
  if (!isRecord(value)) return false;
  if (!hasStrings(value, ["id", "title", "author", "genre", "targetCompetition", "deadline", "createdAt"])) return false;
  if (!value.id || !Number.isFinite(Date.parse(value.createdAt as string))) return false;
  if (typeof value.currentStep !== "number" || !Number.isFinite(value.currentStep) || typeof value.isCompleted !== "boolean") return false;
  // Older backups may predate these fields.
  if (["authorNote", "proposalScript"].some((key) => value[key] !== undefined && typeof value[key] !== "string")) return false;
  if (value.updatedAt !== undefined && (typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt)))) return false;
  if (value.userType !== undefined && value.userType !== "student" && value.userType !== "general") return false;
  if (!hasStrings(value.story, ["logline", "theme", "setting", "plotOutline", "totalEpisodes"])) return false;
  if (!Array.isArray(value.characters) || !value.characters.every((ch) => hasStrings(ch, ["name", "role", "age", "appearance", "personality", "backstory"]))) return false;
  if (!Array.isArray(value.episodes) || !value.episodes.every((ep) =>
    isRecord(ep) && typeof ep.episodeNumber === "number" && Number.isFinite(ep.episodeNumber)
    && hasStrings(ep, ["title", "synopsis", "script"]) && typeof ep.isCompleted === "boolean"
    && Array.isArray(ep.cuts) && ep.cuts.every((cut) => hasStrings(cut, ["angle", "description", "dialogue", "soundEffect"]))
  )) return false;
  if (value.ideaStage !== undefined && value.ideaStage !== 0 && value.ideaStage !== 1 && value.ideaStage !== 2) return false;
  if (value.mentorChats !== undefined && (!isRecord(value.mentorChats) || !Object.entries(value.mentorChats).every(([step, messages]) =>
    ["story", "character", "panel", "script", "completion"].includes(step) && Array.isArray(messages) && messages.every((m) => isRecord(m) && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
  ))) return false;
  if (value.reviewChecks !== undefined && (!isRecord(value.reviewChecks) || !Object.values(value.reviewChecks).every((check) => typeof check === "boolean"))) return false;
  return value.ideaChat === undefined || (Array.isArray(value.ideaChat) && value.ideaChat.every((m) =>
    isRecord(m) && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  ));
}
