"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import FullscreenToggle from "@/components/FullscreenToggle";
import JourneySidebar from "./JourneySidebar";
import StepHelpDialog from "./StepHelpDialog";
import { AiAutofillProgress } from "./AiAutofill";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, BookOpen, X } from "lucide-react";
import { type AiChatHandle } from "@/components/ai-assistant/AiChat";
import FloatingAiMentor from "@/components/ai-assistant/FloatingAiMentor";
import { useProject } from "@/lib/use-project";
import { getProject, updateProject, type Project } from "@/lib/storage";
import { STEPS } from "@/lib/utils";
import type { PromptStep } from "@/lib/prompts";
import base from "@/app/project/[id]/idea/idea.module.css";
import styles from "./workspace.module.css";

const GUIDES = {
  2: {
    description: "아이디어의 출발점을, 해결할 문제와 필요한 이유로 구체화해요.",
    goal: "어떤 문제를 왜 해결해야 하는지, 해결 방향까지 명확하게 설명하기",
  },
  3: {
    description: "서비스를 사용하는 사람과 운영하는 사람의 필요를 나누어 살펴봐요.",
    goal: "누가 어떤 상황에서 무엇을 얻고 싶은지 구체적으로 정리하기",
  },
  4: {
    description: "아이디어를 실제로 만들 수 있도록, 기능별 동작과 입출력을 설계해요.",
    goal: "핵심 기능마다 입력 → 처리 → 출력 흐름을 설명하기",
  },
  5: {
    description: "지금까지 정리한 내용을 연결해, 개발의 기준이 될 기획서를 작성해요.",
    goal: "문제·사용자·핵심 기능·기대 효과가 연결된 기획서 완성하기",
  },
  6: {
    description: "기획의 일관성과 전달 내용을 점검하고, 다음 실행을 준비해요.",
    goal: "기획서를 검토하고 공유·제출·개발에 사용할 최종본 준비하기",
    steps: [
      ["내용 점검", "기획서를 읽으며 체크리스트를 확인해요.", "실제로 확인한 항목만 체크해요. 상태는 이 브라우저에 저장되어 다음에 이어서 볼 수 있어요.", "예: 한 줄 소개와 사용자, 기능이 같은 문제를 설명하는지 확인"],
      ["전달 내용 정리", "공유할 때 필요한 메시지를 남겨요.", "기획 배경이나 다음 실행 계획을 메모에 적어요. 학생 모드에서는 지원 동기를 정리할 수 있어요.", "예: 첫 구현에서는 공지 목록과 마감 알림까지 만들 계획"],
      ["최종본 준비", "모든 항목을 확인했다면 완료 처리해요.", "최종 요약을 다운로드해 보관해요. 완료 후에도 각 단계를 다시 열어 내용을 확인할 수 있어요.", "예: 최종 요약과 프로젝트 백업을 함께 보관"],
    ],
  },
} as const;

type Props = {
  projectId: string;
  step: 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  actions?: ReactNode;
  onSave?: () => Promise<void>;
  busy?: boolean;
  autofillMessage?: string;
  onNext?: () => void | Promise<void>;
  nextLabel?: string;
  mentorStep: Exclude<PromptStep, "idea">;
  mentorMessage: string;
  mentorPlaceholder: string;
  mentorRef: RefObject<AiChatHandle | null>;
  mentorContext?: Partial<Pick<Project, "story" | "characters" | "episodes" | "proposalScript" | "authorNote">>;
};

export default function ProjectWorkspace({ projectId, step, children, actions, onSave, busy = false, autofillMessage, onNext, nextLabel, mentorStep, mentorMessage, mentorPlaceholder, mentorRef, mentorContext }: Props) {
  const project = useProject(projectId);
  const router = useRouter();
  const [guideIndex, setGuideIndex] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [notice, setNotice] = useState("");
  const config = GUIDES[step];
  const current = GUIDES[6].steps[guideIndex];

  useEffect(() => {
    const latest = getProject(projectId);
    if (latest && latest.currentStep < step) updateProject(projectId, { currentStep: step });
  }, [projectId, step]);

  async function navigate(href: string) {
    if (busy || chatBusy || navigating) { setNotice("AI 응답이나 저장이 끝난 뒤 이동해주세요."); return; }
    setNavigating(true);
    try { await onSave?.(); router.push(href); }
    catch { setNotice("저장하지 못했어요. 내용을 확인한 뒤 다시 시도해주세요."); setNavigating(false); }
  }

  if (project === undefined) return <main className={base.status} role="status">프로젝트를 불러오고 있어요.</main>;
  if (project === null) return <main className={base.status}><h1>프로젝트를 찾을 수 없어요</h1><p>이 브라우저에 저장된 프로젝트인지 확인해주세요.</p><Link className={base.primary} href="/dashboard">프로젝트 목록으로</Link></main>;
  const dashboardHref = project.userType === "general" ? "/dashboard?type=general" : "/dashboard?type=student";
  const previous = STEPS[step - 2];
  const href = (route: string) => "/project/" + encodeURIComponent(projectId) + "/" + route;
  const context = JSON.stringify({
    프로젝트: project.title,
    현재단계: STEPS[step - 1].label,
    현재작성내용: mentorContext ?? { authorNote: project.authorNote, reviewChecks: project.reviewChecks },
    문제정의: project.story,
    이해관계자: project.characters,
    기능설계: project.episodes,
    기획서: project.proposalScript,
    아이디어대화: project.ideaChat?.slice(-8),
  }).slice(0, 28000);

  return (
    <div className={base.page + " " + base.workspacePage}>
      <header className={base.header}>
        <Link href={dashboardHref} className={base.brand} onClick={(event) => { event.preventDefault(); void navigate(dashboardHref); }}><BrandMark /></Link>
        <span className={base.mobileStage}>{STEPS[step - 1].label} · {step} / 6</span>
      </header>
      <div className={base.layout + " " + base.journeyLayout}>
        <JourneySidebar project={project} step={step} onNavigate={(target) => { void navigate(target); }} />
        <main className={base.main + " " + styles.withFloatingHelp}>
          <div className={base.heading}>
            <div><p className={base.eyebrow}>STEP {String(step).padStart(2, "0")} · 생각을 구체적으로</p><h1>{STEPS[step - 1].label}</h1><p className={base.description}>{config.description}</p></div>
            <div className={base.headingActions}>
              <button className={base.helpButton} onClick={() => setHelpOpen(true)}><BookOpen size={14} /> 사용 방법</button>
              <FullscreenToggle />
            </div>
          </div>
          {step === 6 && <>
            <ol className={base.flow} aria-label="이번 단계 사용 안내">{GUIDES[6].steps.map((item, index) => <li key={item[0]}><button onClick={() => setGuideIndex(index)} aria-current={index === guideIndex ? "step" : undefined}><span>{index + 1}</span>{item[0]}</button></li>)}</ol>
            <section className={base.quickGuide} aria-label="간단한 작성 안내">
              <span>{current[0]}</span><p>{current[1]}</p>
            </section>
          </>}
          {actions && <div className={styles.toolbar} role="group" aria-label="작성 도구">{actions}</div>}
          {autofillMessage && <AiAutofillProgress key={autofillMessage} message={autofillMessage} />}
          {notice && <p className={base.error} role="status">{notice}</p>}
          <fieldset className={styles.editor} aria-label="작성 내용" aria-busy={Boolean(autofillMessage)} disabled={Boolean(autofillMessage)}>{children}</fieldset>
          <footer className={base.footer}>
            <div><span>이번 단계의 목표</span><p>{config.goal}</p><button className={styles.previous} disabled={busy || chatBusy || navigating} onClick={() => void navigate(href(previous.route))}><ArrowLeft size={13} /> 이전: {previous.label}</button></div>
            {onNext ? <button className={base.primary} disabled={busy || chatBusy || navigating} onClick={() => void onNext()}>{nextLabel ?? "다음 단계"}<ArrowRight size={15} /></button> : <button className={base.primary} disabled={busy || chatBusy || navigating} onClick={() => void navigate(dashboardHref)}>프로젝트 목록<ArrowRight size={15} /></button>}
          </footer>
        </main>
      </div>
      <FloatingAiMentor key={projectId + mentorStep} ref={mentorRef} project={project} step={step} mentorStep={mentorStep} initialMessage={mentorMessage} placeholder={mentorPlaceholder} context={context} onBusyChange={setChatBusy} onMessagesChange={(messages) => {
        try { const latest = getProject(projectId); if (latest) updateProject(projectId, { mentorChats: { ...latest.mentorChats, [mentorStep]: messages } }); }
        catch { setNotice("AI 대화를 저장하지 못했어요. 브라우저 저장 공간을 확인해주세요."); }
      }} />
      {step !== 6 ? <StepHelpDialog step={step} open={helpOpen} onOpenChange={setHelpOpen} /> : <Dialog.Root open={helpOpen} onOpenChange={setHelpOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={base.overlay} />
          <Dialog.Content className={base.dialog + " " + base.detailedHelp}>
            <p className={base.eyebrow}>STEP {String(step).padStart(2, "0")} · 사용 방법</p>
            <Dialog.Title>{STEPS[step - 1].label}, 이렇게 진행해요.</Dialog.Title>
            <Dialog.Description>{config.goal}</Dialog.Description>
            <ol className={base.helpSteps}>
              {GUIDES[6].steps.map((item, index) => <li key={item[0]} data-current={index === guideIndex}>
                <strong>{item[0]}</strong>
                <p>{item[2]}</p>
                <p className={base.helpExample}>{item[3]}</p>
              </li>)}
            </ol>
            <div className={base.helpNote}><strong>다음 단계로 가기 전에</strong><p>{onSave ? "작성한 내용은 저장 버튼으로 보관해주세요. AI가 만든 초안을 사용했다면 사실과 맞는지 확인하고 내 기획에 맞게 다듬어요." : "체크리스트는 실제로 확인한 항목만 표시해주세요. 최종 요약을 내려받고 프로젝트 목록에서 전체 백업도 보관할 수 있어요."}</p></div>
            <Dialog.Close className={base.close} aria-label="사용 방법 닫기"><X size={19} /></Dialog.Close>
            <div className={base.dialogActions}><Dialog.Close className={base.primary}>이해했어요</Dialog.Close></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>}
    </div>
  );
}
