"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BrandMark from "@/components/brand/BrandMark";
import FullscreenToggle from "@/components/FullscreenToggle";
import WorkspaceSidebar from "@/components/project-workspace/WorkspaceSidebar";
import { useRouter, useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, BookOpen, Check, Download, Loader2, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { GENRES, STEPS } from "@/lib/utils";
import { createProject, deleteProject, updateProject, type Project, type UserType } from "@/lib/storage";
import { useProjects } from "@/lib/use-project";
import { getDaysUntil, getProjectHref, getProjectProgress } from "@/lib/project-status";
import { exportAllProjects, importProjects } from "@/lib/download";
import { clearDirectory, isFileSystemAccessSupported, requestDirectory } from "@/lib/fileStorage";
import base from "@/app/project/[id]/idea/idea.module.css";
import styles from "./dashboard.module.css";

type FormState = { title: string; author: string; genre: string; targetCompetition: string; deadline: string; userType: UserType };
type Filter = "all" | "active" | "completed";
type Sort = "recent" | "progress" | "deadline";
const EMPTY_FORM: FormState = { title: "", author: "", genre: "", targetCompetition: "", deadline: "", userType: "student" };

function updatedTime(project: Project) {
  return Date.parse(project.updatedAt ?? project.createdAt) || 0;
}

function formatDate(value: string, dateOnly = false) {
  const date = new Date(dateOnly ? value + "T00:00:00" : value);
  if (!Number.isFinite(date.getTime())) return "미정";
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join(".");
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preferredUserType: UserType = searchParams.get("type") === "general" ? "general" : "student";
  const stored = useProjects();
  const projects = stored ?? [];
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<Sort>("recent");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [connectFolder, setConnectFolder] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  const completed = projects.filter((project) => project.isCompleted).length;
  const active = projects.length - completed;
  const term = search.trim().toLocaleLowerCase();
  const filtered = projects.filter((project) => {
    const matchesState = filter === "all" || (filter === "completed" ? project.isCompleted : !project.isCompleted);
    return matchesState && [project.title, project.author, project.genre, project.targetCompetition].some((value) => String(value ?? "").toLocaleLowerCase().includes(term));
  }).sort((a, b) => {
    if (sortBy === "progress") return getProjectProgress(b) - getProjectProgress(a) || updatedTime(b) - updatedTime(a);
    if (sortBy === "deadline") {
      const difference = (a.isCompleted ? Infinity : getDaysUntil(a.deadline) ?? Infinity) - (b.isCompleted ? Infinity : getDaysUntil(b.deadline) ?? Infinity);
      if (Number.isFinite(difference) && difference !== 0) return difference;
      if (difference === -Infinity || difference === Infinity) return difference;
    }
    return updatedTime(b) - updatedTime(a);
  });

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, userType: preferredUserType });
    setConnectFolder(false);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(project: Project) {
    setEditingId(project.id);
    setForm({ title: project.title, author: project.author ?? "", genre: project.genre ?? "", targetCompetition: project.targetCompetition ?? "", deadline: project.deadline ?? "", userType: project.userType ?? "student" });
    setConnectFolder(false);
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (creating) return;
    if (!form.title.trim()) { setFormError("프로젝트 제목을 입력해주세요."); return; }
    setCreating(true);
    setFormError("");
    try {
      const data = { ...form, title: form.title.trim(), author: form.author.trim(), targetCompetition: form.targetCompetition.trim() };
      if (editingId) {
        updateProject(editingId, data);
        setShowModal(false);
        setNotice("프로젝트 정보를 저장했어요.");
      } else {
        const project = createProject(data);
        if (connectFolder && isFileSystemAccessSupported()) await requestDirectory(project.id);
        setShowModal(false);
        router.push(getProjectHref(project));
      }
    } catch {
      setFormError("저장하지 못했어요. 브라우저 저장 공간과 설정을 확인해주세요.");
    } finally { setCreating(false); }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try { await importProjects(file); setNotice("프로젝트를 가져왔어요. 같은 프로젝트는 백업 파일의 내용으로 업데이트됩니다."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "백업 파일을 가져오지 못했어요."); }
    finally { event.target.value = ""; }
  }

  function handleExport() {
    try { exportAllProjects(); setNotice("전체 프로젝트의 백업 파일을 다운로드했어요."); }
    catch { setNotice("백업 파일을 만들지 못했어요. 다시 시도해주세요."); }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      deleteProject(deleteTarget.id);
      await clearDirectory(deleteTarget.id);
      setDeleteTarget(null);
      setNotice("프로젝트를 삭제했어요.");
    } catch { setDeleteError("삭제하지 못했어요. 다시 시도해주세요."); }
    finally { setDeleting(false); }
  }

  const backupButtons = <>
    <button onClick={() => importRef.current?.click()}><Upload size={14} /> 백업 가져오기</button>
    <button onClick={handleExport} disabled={projects.length === 0}><Download size={14} /> 전체 백업</button>
  </>;

  return (
    <div className={base.page + " " + base.workspacePage}>
      <input ref={importRef} type="file" accept=".json,application/json" aria-label="프로젝트 백업 파일 선택" hidden onChange={handleImport} />
      <header className={base.header + " " + styles.header}>
        <Link href="/" className={base.brand}><BrandMark /></Link>
        <span className={styles.mode}>{preferredUserType === "general" ? "선생님·일반인 모드" : "학생 모드"}</span>
      </header>

      <div className={base.layout + " " + base.journeyLayout}>
        <WorkspaceSidebar userType={preferredUserType} active="projects" projectCount={projects.length} footer={
          <div className={styles.sidebarFooter}>
            <p className={styles.toolsLabel}>데이터 보관</p>
            <div className={styles.backupTools}>{backupButtons}</div>
            <p className={styles.localNote}>프로젝트는 현재 브라우저에 저장돼요.<br />백업 파일을 따로 보관해주세요.</p>
          </div>
        } />

        <main className={base.main}>
          <div className={styles.heading}>
            <div><p className={base.eyebrow}>나의 작업 공간 · 생각을 기획으로</p><h1>내 프로젝트</h1><p>떠오른 생각을 기록하고, 나만의 기획서로 구체화해보세요.</p></div>
            <div className={base.headingActions}>
              <button className={base.primary} onClick={openCreate}><Plus size={16} /> 새 프로젝트</button>
              <FullscreenToggle />
            </div>
          </div>
          <div className={styles.mobileTools}>{backupButtons}<Link href={"/guide?type=" + preferredUserType}><BookOpen size={14} /> 사용 가이드</Link></div>

          {notice && <div className={styles.notice} role="status"><p>{notice}</p><button onClick={() => setNotice("")} aria-label="알림 닫기"><X size={16} /></button></div>}

          {projects.length > 0 && (
            <>
              <div className={styles.toolbar}>
                <div className={styles.filters} role="group" aria-label="프로젝트 상태 필터">
                  {([{ value: "all", label: "전체", count: projects.length }, { value: "active", label: "작성 중", count: active }, { value: "completed", label: "완료", count: completed }] as const).map((item) => <button key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}<span>{item.count}</span></button>)}
                </div>
                <div className={styles.searchSort}>
                  <div className={styles.search}><Search size={15} /><label className={styles.srOnly} htmlFor="project-search">프로젝트 검색</label><input id="project-search" value={search} placeholder="제목, 작성자, 분야 검색" onChange={(event) => setSearch(event.target.value)} />{search && <button aria-label="검색어 지우기" onClick={() => setSearch("")}><X size={14} /></button>}</div>
                  <label className={styles.srOnly} htmlFor="project-sort">프로젝트 정렬</label><select id="project-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as Sort)}><option value="recent">최근 수정 순</option><option value="progress">진행률 순</option><option value="deadline">일정 임박 순</option></select>
                </div>
              </div>
              <div className={styles.listNote}><p>프로젝트를 선택하면 마지막 작업 단계에서 이어집니다.</p><span aria-live="polite">{filtered.length}개의 프로젝트</span></div>
            </>
          )}

          {stored === undefined ? <div className={styles.loading} role="status"><Loader2 size={22} className="animate-spin" /> 프로젝트를 불러오고 있어요.</div> : projects.length === 0 ? (
            <section className={styles.empty} aria-labelledby="empty-title">
              <Image src="/ideabot-remove.png" width={54} height={54} alt="" unoptimized />
              <p className={base.eyebrow}>아이디어의 첫 페이지</p>
              <h2 id="empty-title">작은 생각 하나부터 시작해요.</h2>
              <p>프로젝트에 이름을 붙이면 준비 끝.<br />아이디어봇과 함께 해결하고 싶은 문제를 찾아보세요.</p>
              <button className={base.primary} onClick={openCreate}><Plus size={16} /> 첫 프로젝트 시작하기</button>
              <ol className={styles.startFlow}><li><span>01</span><strong>제목 정하기</strong><p>떠오르는 이름이면 충분해요.</p></li><li><span>02</span><strong>아이디어 꺼내기</strong><p>불편했던 경험부터 이야기해요.</p></li><li><span>03</span><strong>기획서로 구체화</strong><p>질문을 따라 한 단계씩 정리해요.</p></li></ol>
            </section>
          ) : filtered.length === 0 ? (
            <section className={styles.noResults}><Search size={28} /><h2>조건에 맞는 프로젝트가 없어요</h2><p>다른 검색어를 입력하거나 상태 필터를 바꿔보세요.</p><button className={base.secondary} onClick={() => { setFilter("all"); setSearch(""); }}>검색·필터 초기화 <ArrowRight size={14} /></button></section>
          ) : (
            <section className={styles.projectPanel} aria-label="내 프로젝트 목록">
              <div className={styles.columnHead} aria-hidden="true"><span>프로젝트</span><span>진행 상황</span><span className={styles.scheduleHead}>일정</span><span>관리</span></div>
              <ul className={styles.projectList}>
                {filtered.map((project) => {
                  const progress = getProjectProgress(project);
                  const days = getDaysUntil(project.deadline);
                  const summary = project.story.logline.trim();
                  return <li key={project.id} className={styles.projectRow}>
                    <Link className={styles.projectInfo} href={getProjectHref(project)} aria-label={project.title + (project.isCompleted ? " · 최종본 보기" : " · 이어서 작성")}>
                      <span className={styles.projectMark} aria-hidden="true">{Array.from(project.title.trim())[0] || "P"}</span>
                      <div className={styles.projectCopy}>
                        <div className={styles.titleLine}><h2>{project.title}</h2><span className={project.isCompleted ? styles.completed : styles.active}>{project.isCompleted ? <Check size={12} /> : <span />}{project.isCompleted ? "기획 완료" : "작성 중"}</span></div>
                        <p className={styles.projectDescription + (!summary ? " " + styles.noSummary : "")}>{summary || (project.isCompleted ? "작성한 기획서를 확인해보세요." : "아직 한 줄 소개가 없어요.")}</p>
                        <div className={styles.projectMeta}><span className={styles.projectCategory}>{project.genre || "분야 미지정"}</span>{project.author && <span>{project.author}</span>}{project.targetCompetition && <span>{project.targetCompetition}</span>}</div>
                      </div>
                    </Link>
                    <div className={styles.progress}><div><span>{project.isCompleted ? "최종 검토 완료" : String(project.currentStep).padStart(2, "0") + " · " + STEPS[project.currentStep - 1]?.label}</span><strong>{progress}%</strong></div><div className={styles.progressTrack} role="progressbar" aria-label={project.title + " 단계 진행률"} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: progress + "%" }} /></div></div>
                    <div className={styles.schedule}>
                      {project.isCompleted ? <span>기획 완료</span> : days !== null ? <><span className={days <= 7 ? styles.urgent : styles.due}>{days < 0 ? (project.userType === "general" ? "목표일 지남" : "마감 지남") : days === 0 ? "오늘까지" : "D-" + days}</span><span>{formatDate(project.deadline, true)}</span></> : <span>일정 미정</span>}
                      <small>수정 {formatDate(project.updatedAt ?? project.createdAt)}</small>
                    </div>
                    <div className={styles.rowActions} role="group" aria-label={project.title + " 관리"}>
                      <Link className={styles.openProject} href={getProjectHref(project)} aria-label={project.title + " 열기"}>{project.isCompleted ? "최종본 보기" : "이어서 작성"}<ArrowRight size={15} /></Link>
                      <div className={styles.management}>
                        <button onClick={() => openEdit(project)} aria-label={project.title + " 정보 수정"} title="프로젝트 정보 수정"><Pencil size={15} /></button>
                        <button onClick={() => { setDeleteTarget(project); setDeleteError(""); }} aria-label={project.title + " 삭제"} title="프로젝트 삭제"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </li>;
                })}
              </ul>
            </section>
          )}
          <footer className={styles.footer}><span>PlanCraft · 생각에서 기획까지</span><span>지금의 생각을 다음 작업으로 이어가세요.</span></footer>
        </main>
      </div>

      <Dialog.Root open={showModal} onOpenChange={(open) => { if (!creating) setShowModal(open); }}>
        <Dialog.Portal><Dialog.Overlay className={base.overlay} /><Dialog.Content className={base.dialog + " " + styles.projectDialog}>
          <p className={base.eyebrow}>{editingId ? "프로젝트 설정" : "새로운 생각의 시작"}</p>
          <Dialog.Title>{editingId ? "프로젝트 정보 수정" : "어떤 아이디어인가요?"}</Dialog.Title>
          <Dialog.Description>{editingId ? "프로젝트의 기본 정보를 수정해주세요." : "제목만 입력하면 바로 시작할 수 있어요. 나머지 정보는 나중에 채워도 괜찮아요."}</Dialog.Description>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}><label htmlFor="dashboard-title">프로젝트 제목 <span>필수</span></label><input id="dashboard-title" value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="예: 학교 알림을 한곳에" maxLength={120} required /></div>
            <div className={styles.formRow}><div className={styles.field}><label htmlFor="dashboard-author">작성자 또는 팀 이름</label><input id="dashboard-author" value={form.author} onChange={(event) => setForm((value) => ({ ...value, author: event.target.value }))} placeholder="이름 또는 팀 이름" /></div><div className={styles.field}><label htmlFor="dashboard-genre">아이디어 분야</label><select id="dashboard-genre" value={form.genre} onChange={(event) => setForm((value) => ({ ...value, genre: event.target.value }))}><option value="">나중에 선택</option>{GENRES.map((genre) => <option key={genre}>{genre}</option>)}</select></div></div>
            <div className={styles.formRow}><div className={styles.field}><label htmlFor="dashboard-target">{form.userType === "general" ? "관련 프로그램·수업" : "참가 공모전"}</label><input id="dashboard-target" value={form.targetCompetition} onChange={(event) => setForm((value) => ({ ...value, targetCompetition: event.target.value }))} placeholder="선택 사항" /></div><div className={styles.field}><label htmlFor="dashboard-deadline">{form.userType === "general" ? "목표 완료일" : "마감일"}</label><input id="dashboard-deadline" type="date" value={form.deadline} onChange={(event) => setForm((value) => ({ ...value, deadline: event.target.value }))} /></div></div>
            {!editingId && isFileSystemAccessSupported() && <label className={styles.folderOption}><input type="checkbox" checked={connectFolder} onChange={(event) => setConnectFolder(event.target.checked)} /><span>작성 내용을 저장할 폴더 연결 <small>선택</small></span></label>}
            <p className={styles.formNote}>{form.userType === "general" ? "선생님·일반인" : "학생"} 모드 · 프로젝트는 현재 브라우저에 저장됩니다.</p>
            {formError && <p className={styles.formError} role="alert">{formError}</p>}
            <div className={styles.formActions}><Dialog.Close type="button" disabled={creating} className={base.secondary}>취소</Dialog.Close><button type="submit" className={base.primary} disabled={creating}>{creating ? <Loader2 size={14} className="animate-spin" /> : editingId ? <Check size={14} /> : <Plus size={14} />}{creating ? "저장 중..." : editingId ? "변경 사항 저장" : "프로젝트 시작하기"}</button></div>
          </form>
          <Dialog.Close className={base.close} disabled={creating} aria-label="프로젝트 창 닫기"><X size={19} /></Dialog.Close>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={deleteTarget !== null} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}>
        <Dialog.Portal><Dialog.Overlay className={base.overlay} /><Dialog.Content className={base.dialog}>
          <p className={base.eyebrow}>프로젝트 관리</p><Dialog.Title>프로젝트를 삭제할까요?</Dialog.Title><Dialog.Description>‘{deleteTarget?.title}’ 프로젝트가 이 브라우저에서 삭제됩니다. 이 작업은 되돌릴 수 없으니 필요한 내용은 먼저 백업해주세요.</Dialog.Description>
          {deleteError && <p className={styles.formError} role="alert">{deleteError}</p>}
          <div className={base.dialogActions}><Dialog.Close disabled={deleting} className={base.secondary}>취소</Dialog.Close><button onClick={handleDelete} disabled={deleting} className={base.primary}>{deleting ? "삭제 중..." : "프로젝트 삭제"}</button></div>
          <Dialog.Close className={base.close} disabled={deleting} aria-label="삭제 창 닫기"><X size={19} /></Dialog.Close>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default function DashboardPage() {
  return <Suspense fallback={<main className={base.status} role="status">작업 공간을 준비하고 있어요.</main>}><DashboardContent /></Suspense>;
}
