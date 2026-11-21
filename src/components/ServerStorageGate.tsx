"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { listCampusProjects, setCampusToken, SMART_CAMPUS_ORIGIN } from "@/lib/campusClient";
import { activateServerProjects, deactivateServerProjects, flushServerWrites, getBrowserProjects, getProjects, getServerSaveError, PROJECTS_CHANGED_EVENT, retryServerWrites, saveProjects } from "@/lib/storage";

type Status = "connecting" | "ready" | "direct" | "error";

export default function ServerStorageGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>("connecting");
  const [message, setMessage] = useState("");
  const [legacyCount, setLegacyCount] = useState(0);
  const [collisionCount, setCollisionCount] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [storageNoticeClosed, setStorageNoticeClosed] = useState(false);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    if (window.parent === window) { setStatus("direct"); return; }
    let mounted = true;
    let connection = 0;
    async function onMessage(event: MessageEvent) {
      if (event.origin !== SMART_CAMPUS_ORIGIN || event.source !== window.parent ||
          event.data?.type !== "sso:token" || typeof event.data.token !== "string") return;
      const requestNumber = ++connection;
      setStatus("connecting");
      setCampusToken(event.data.token);
      deactivateServerProjects();
      try {
        const records = await listCampusProjects();
        if (!mounted || requestNumber !== connection) return;
        const ids = new Set(records.map(record => record.project.id));
        const browser = getBrowserProjects();
        setLegacyCount(browser.filter(project => !ids.has(project.id)).length);
        setCollisionCount(browser.filter(project => ids.has(project.id)).length);
        activateServerProjects(records);
        setMessage("");
        setStatus("ready");
      } catch (error) {
        if (!mounted || requestNumber !== connection) return;
        setCampusToken(null);
        deactivateServerProjects();
        setMessage(error instanceof Error ? error.message : "서버 저장소에 연결하지 못했어요.");
        setStatus("error");
      }
    }
    function expired() {
      connection += 1;
      deactivateServerProjects();
      setStatus("error");
      setMessage("스마트 캠퍼스 로그인 세션이 끝났어요. 다시 로그인해 주세요.");
    }
    function changed() { setSaveError(getServerSaveError()); }
    window.addEventListener("message", onMessage);
    window.addEventListener("plancraft-sso-expired", expired);
    window.addEventListener(PROJECTS_CHANGED_EVENT, changed);
    window.parent.postMessage({ type: "sso:ready" }, SMART_CAMPUS_ORIGIN);
    return () => {
      mounted = false;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("plancraft-sso-expired", expired);
      window.removeEventListener(PROJECTS_CHANGED_EVENT, changed);
    };
  }, []);

  const migrate = async () => {
    setMigrating(true);
    setMessage("");
    try {
      const existing = new Set(getProjects().map(project => project.id));
      const additions = getBrowserProjects().filter(project => !existing.has(project.id));
      saveProjects([...getProjects(), ...additions]);
      await flushServerWrites();
      setLegacyCount(0);
      setMessage(`${additions.length}개 기획서를 서버로 복사했어요. 브라우저 원본은 남아 있어요.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "기획서를 서버로 복사하지 못했어요.");
    } finally { setMigrating(false); }
  };

  const backupCollisions = () => {
    const serverIds = new Set(getProjects().map(project => project.id));
    const copies = getBrowserProjects().filter(project => serverIds.has(project.id));
    const url = URL.createObjectURL(new Blob([JSON.stringify(copies, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `plancraft_browser_copies_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("브라우저 원본 다운로드를 시작했어요. 다운로드된 파일을 확인해 주세요.");
  };

  if (["/", "/guide", "/login", "/signup"].includes(pathname)) return <>{children}</>;
  if (status === "connecting") return <main className="m-auto p-8 text-center">스마트 캠퍼스 계정과 서버 저장소를 연결하고 있어요.</main>;
  if (status === "error") return <main className="m-auto max-w-md p-8 text-center">
    <h1 className="text-xl font-bold">서버 저장소에 연결하지 못했어요</h1>
    <p className="mt-3 text-sm">{message}</p>
    <button type="button" onClick={() => window.parent.postMessage({ type: "sso:ready" }, SMART_CAMPUS_ORIGIN)}
      className="mt-5 rounded-full bg-[#D4547A] px-5 py-2 text-sm text-white">다시 연결</button>
  </main>;

  return <>
    {status === "ready" && (!storageNoticeClosed || saveError) && <div role="status" className="relative bg-[#FFF2F5] px-10 py-2 text-center text-sm text-[#6C4050]">
      서버 저장 연결됨{saveError ? ` · 저장 오류: ${saveError}` : ""}
      {saveError && <button type="button" onClick={() => void retryServerWrites()} className="ml-3 font-semibold underline">저장 다시 시도</button>}
      {legacyCount > 0 && <button type="button" disabled={migrating} onClick={() => void migrate()} className="ml-3 font-semibold underline disabled:opacity-50">
        {migrating ? "복사 중" : `이 브라우저의 이전 기획서 ${legacyCount}개 서버로 복사`}
      </button>}
      {collisionCount > 0 && <>
        <span className="ml-3">같은 ID의 기획서 {collisionCount}개는 서버 사본을 보여 줍니다. 브라우저 원본은 남아 있어요.</span>
        <button type="button" onClick={backupCollisions} className="ml-3 font-semibold underline">브라우저 원본 JSON 백업</button>
      </>}
      {message && <span className="ml-3">{message}</span>}
      {!saveError && <button type="button" aria-label="서버 저장 안내 닫기" title="서버 저장 안내 닫기" onClick={() => setStorageNoticeClosed(true)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-lg leading-none hover:bg-[#F9E2E9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6C4050]">×</button>}
    </div>}
    {status === "direct" && <div role="status" className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      브라우저 저장 중 · 학교 컴퓨터에서는 재부팅 후 사라질 수 있어요. <a href={SMART_CAMPUS_ORIGIN} className="font-semibold underline">스마트 캠퍼스에서 서버 저장 사용</a>
    </div>}
    {children}
  </>;
}
