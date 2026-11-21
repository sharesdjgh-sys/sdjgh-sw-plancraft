"use client";

import type { Project } from "./storage";

export const SMART_CAMPUS_ORIGIN = "https://platform.sdjgh-ai.kr";
const API = `${SMART_CAMPUS_ORIGIN}/api/plancraft`;
let token: string | null = null;
let epoch = 0;

export type ServerProjectRecord = { project: Project; revision: number; updatedAt: string };

export function setCampusToken(value: string | null): void {
  token = value && /^[A-Za-z0-9._~-]+$/.test(value) ? value : null;
  epoch += 1;
}

export function getCampusEpoch(): number { return epoch; }

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const currentToken = token;
  const currentEpoch = epoch;
  if (!currentToken) throw new Error("스마트 캠퍼스 로그인이 필요해요.");
  const response = await fetch(`${API}${path}`, {
    ...init,
    credentials: "omit",
    cache: "no-store",
    headers: { Authorization: `Bearer ${currentToken}`, ...init.headers },
  });
  if (currentEpoch !== epoch) throw new Error("로그인 계정이 변경되었어요.");
  if (!response.ok) {
    if (response.status === 401) {
      setCampusToken(null);
      window.parent.postMessage({ type: "sso:expired" }, SMART_CAMPUS_ORIGIN);
      window.dispatchEvent(new Event("plancraft-sso-expired"));
      throw new Error("스마트 캠퍼스 로그인 세션이 끝났어요. 다시 로그인해 주세요.");
    }
    const body = await response.json().catch(() => ({})) as { error?: string };
    const messages: Record<string, string> = {
      storage_unconfigured: "서버 저장 경로가 준비되지 않았어요.",
      account_security_required: "스마트 캠퍼스 계정 보안 설정이 필요해요.",
      registration_required: "계정 등록 정보가 확인되지 않아 저장할 수 없어요.",
      access_denied: "이 계정에는 플랜 크래프트 서버 저장 권한이 없어요.",
      project_too_large: "기획서가 서버 저장 한도를 넘었어요.",
      owner_quota_exceeded: "계정의 서버 저장 공간이 가득 찼어요.",
      revision_conflict: "다른 화면에서 기획서가 수정되었어요. 현재 내용을 JSON으로 백업해 주세요.",
    };
    throw new Error(messages[body.error ?? ""] ?? `서버 저장 요청에 실패했어요 (${response.status}).`);
  }
  return response;
}

export async function listCampusProjects(): Promise<ServerProjectRecord[]> {
  const body = await (await request("/projects")).json() as { projects: { id: string }[] };
  return Promise.all(body.projects.map(async ({ id }) =>
    await (await request(`/projects/${encodeURIComponent(id)}`)).json() as ServerProjectRecord));
}

export async function putCampusProject(project: Project, revision: number): Promise<number> {
  const body = await (await request(`/projects/${encodeURIComponent(project.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, revision }),
  })).json() as { revision: number };
  return body.revision;
}

export async function deleteCampusProject(id: string, revision: number): Promise<void> {
  await request(`/projects/${encodeURIComponent(id)}`, {
    method: "DELETE", headers: { "If-Match": String(revision) },
  });
}
