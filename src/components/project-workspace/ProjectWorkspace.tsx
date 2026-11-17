"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, X } from "lucide-react";
import AiChat, { type AiChatHandle } from "@/components/ai-assistant/AiChat";
import { useProject } from "@/lib/use-project";
import { getProject, updateProject } from "@/lib/storage";
import { STEPS } from "@/lib/utils";
import type { PromptStep } from "@/lib/prompts";
import base from "@/app/project/[id]/idea/idea.module.css";
import styles from "./workspace.module.css";

const GUIDES = {
  2: {
    description: "아이디어의 출발점을, 해결할 문제와 필요한 이유로 구체화해요.",
    goal: "어떤 문제를 왜 해결해야 하는지, 해결 방향까지 명확하게 설명하기",
    steps: [
      ["아이디어와 문제", "해결하려는 문제를 구체적으로 적어보세요.", "한 줄 소개와 실제 불편함을 먼저 작성해요. 기능 목록보다 문제의 상황이 먼저예요.", "예: 학부모가 여러 알림 채널을 확인하다 체험학습 신청 기한을 놓친다."],
      ["배경과 필요성", "왜 지금 이 문제를 해결해야 하나요?", "문제가 발생하는 환경과 직접 관찰한 사례를 적어요. 확인하지 않은 통계는 사실처럼 쓰지 않아요.", "예: 문자, 학교 앱, 종이 알림장이 함께 사용되어 확인할 곳이 많다."],
      ["해결 방향", "서비스가 어떻게 문제를 바꿀지 정리해요.", "핵심 기능과 사용 후 달라질 모습을 적고, 다음 단계에서 사용자 관점을 더 살펴봐요.", "예: 공지를 한곳에 모으고 신청 기한을 알려준다."],
    ],
  },
  3: {
    description: "서비스를 사용하는 사람과 운영하는 사람의 필요를 나누어 살펴봐요.",
    goal: "누가 어떤 상황에서 무엇을 얻고 싶은지 구체적으로 정리하기",
    steps: [
      ["대상 찾기", "서비스가 필요한 사람부터 추가해보세요.", "직접 사용하는 사람과 운영·관리하는 사람을 나눠 생각해요. 추가 버튼으로 대상을 만들 수 있어요.", "예: 학부모는 주요 사용자, 담임교사는 공지를 관리하는 운영자"],
      ["불편함 살피기", "대상마다 지금 겪는 불편함을 적어요.", "편집을 눌러 현재의 어려움과 사용 상황을 구체적으로 작성해요.", "예: 필요한 공지를 찾기 위해 여러 채널을 반복해서 확인한다."],
      ["사용 목적 정리", "각 대상에게 어떤 도움이 되어야 할까요?", "사용 목적과 서비스와의 관계까지 정리하면 다음 단계의 기능 우선순위를 정하기 쉬워요.", "예: 학부모는 기한을 놓치지 않고, 교사는 반복 안내를 줄이고 싶다."],
    ],
  },
  4: {
    description: "아이디어를 실제로 만들 수 있도록, 기능별 동작과 입출력을 설계해요.",
    goal: "핵심 기능마다 입력 → 처리 → 출력 흐름을 설명하기",
    steps: [
      ["기능 선택", "가장 필요한 기능부터 하나씩 설계해요.", "위 기능 목록에서 편집할 기능을 고르거나 추가해요. 기능 이름과 설명을 먼저 적어요.", "예: 공지 모아보기 · 학부모가 필요한 공지를 한곳에서 확인한다."],
      ["처리 흐름", "사용 시작부터 결과까지 순서대로 나눠요.", "단계 추가로 사용자 입력, 시스템 처리, 결과 출력을 구성해요. 순서는 드래그해 바꿀 수 있어요.", "예: 학교 선택 → 공지 조회 → 마감일 순으로 정렬 → 목록 표시"],
      ["입출력 점검", "각 동작에 필요한 값과 결과를 정리해요.", "입력 데이터와 출력·결과를 적고 실패하거나 비어 있는 상황도 생각해봐요.", "예: 입력은 학교·학년, 출력은 조건에 맞는 공지 목록"],
    ],
  },
  5: {
    description: "지금까지 정리한 내용을 연결해, 개발의 기준이 될 기획서를 작성해요.",
    goal: "문제·사용자·핵심 기능·기대 효과가 연결된 기획서 완성하기",
    steps: [
      ["재료 확인", "앞 단계에서 정리한 내용을 살펴보세요.", "참고 내용 펼치기로 사용자와 기능 목록을 확인해요. AI 자동채우기로 초안을 보완할 수도 있어요.", "예: 문제 정의 → 주요 사용자 → 핵심 기능 순으로 핵심 문장을 모으기"],
      ["기획서 작성", "개발할 사람이 이해할 수 있게 연결해요.", "배경과 필요성, 해결 방안, 핵심 기능, 기대 효과를 작성해요. 모호한 표현보다 구체적인 동작을 적어요.", "예: 공지를 편하게 본다 → 학교·학년으로 필터링한 공지를 마감일 순으로 보여준다."],
      ["흐름 점검", "기능이 앞에서 찾은 문제를 해결하나요?", "사용자·기능·기대 효과가 서로 맞는지 읽어보고 저장해요. 다음 단계에서 최종 점검을 진행해요.", "예: 신청 기한을 놓치는 문제에 마감 알림 기능이 연결되는지 확인"],
    ],
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
  onNext?: () => void | Promise<void>;
  nextLabel?: string;
  mentorStep: Exclude<PromptStep, "idea">;
  mentorMessage: string;
  mentorPlaceholder: string;
  mentorRef: RefObject<AiChatHandle | null>;
};

export default function ProjectWorkspace({ projectId, step, children, actions, onSave, busy = false, onNext, nextLabel, mentorStep, mentorMessage, mentorPlaceholder, mentorRef }: Props) {
  const project = useProject(projectId);
  const router = useRouter();
  const [guideIndex, setGuideIndex] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [notice, setNotice] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const config = GUIDES[step];
  const current = config.steps[guideIndex];

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

  return (
    <div className={base.page}>
      <header className={base.header}>
        <Link href={dashboardHref} className={base.brand} onClick={(event) => { event.preventDefault(); void navigate(dashboardHref); }}><Image src="/plancraft-logo-remove.png" width={29} height={29} alt="" unoptimized /><span>PlanCraft</span></Link>
        <div className={base.breadcrumb}><Link href={dashboardHref} onClick={(event) => { event.preventDefault(); void navigate(dashboardHref); }}>내 작업 공간</Link><ChevronRight size={13} /><span>{project.title}</span></div>
        <span className={base.storageNote}><span /> {onSave ? "저장 버튼으로 기획 보관" : "이 브라우저에 저장"}</span>
        <span className={base.mobileStage}>{STEPS[step - 1].label} · {step} / 6</span>
      </header>
      <div className={base.layout}>
        <aside className={base.sidebar + " " + styles.sidebar}>
          <p className={base.sidebarLabel}>나의 기획 여정</p>
          <nav className={base.steps} aria-label="기획 단계">
            {STEPS.map((item) => {
              const inner = <><span className={base.stepNumber}>{String(item.id).padStart(2, "0")}</span><span>{item.label}</span></>;
              return item.id <= project.currentStep || project.isCompleted
                ? <Link key={item.id} href={href(item.route)} className={item.id === step ? base.activeStep : undefined} aria-current={item.id === step ? "step" : undefined} onClick={(event) => { event.preventDefault(); void navigate(href(item.route)); }}>{inner}</Link>
                : <span key={item.id} className={base.futureStep}>{inner}</span>;
            })}
          </nav>
          <div className={base.sidebarBottom}><button onClick={() => setHelpOpen(true)}><BookOpen size={14} /> 막막할 때, 사용 가이드</button><p>한 단계씩 구체화하며,<br />실제로 만들 수 있는 기획으로.</p></div>
        </aside>
        <main className={base.main}>
          <div className={base.heading}>
            <div><p className={base.eyebrow}>STEP {String(step).padStart(2, "0")} · 생각을 구체적으로</p><h1>{STEPS[step - 1].label}</h1><p className={base.description}>{config.description}</p></div>
            <button className={base.helpButton} onClick={() => setHelpOpen(true)}><BookOpen size={14} /> 사용 방법</button>
          </div>
          <ol className={base.flow} aria-label="이번 단계 사용 안내">{config.steps.map((item, index) => <li key={item[0]}><button onClick={() => setGuideIndex(index)} aria-current={index === guideIndex ? "step" : undefined}><span>{index + 1}</span>{item[0]}</button></li>)}</ol>
          <section className={base.task} aria-labelledby="workspace-task-title">
            <p className={base.taskLabel}>지금 할 일 <span>{String(guideIndex + 1).padStart(2, "0")} / 03</span></p>
            <h2 id="workspace-task-title">{current[1]}</h2><p className={base.taskDescription}>{current[2]}</p>
            <details key={guideIndex} className={base.answerGuide}><summary>어떻게 작성하면 좋나요?</summary><p>{current[3]}</p></details>
            <button className={base.nextGuide} onClick={() => mentorRef.current?.setDraft(current[1] + " 현재 기획 내용을 구체화하는 방법을 도와주세요.")}>이 부분을 AI에게 물어보기 <ArrowRight size={13} /></button>
          </section>
          {actions && <div className={styles.toolbar} role="group" aria-label="작성 도구">{actions}</div>}
          {notice && <p className={base.error} role="status">{notice}</p>}
          <div ref={editorRef} className={styles.editor}>{children}</div>
          <section className={styles.mentor} aria-label="단계별 AI 도움">
            <p className={styles.mentorHint}>작성하다 막히면, 아이디어봇과 함께 구체화해보세요.</p>
            <AiChat key={projectId + mentorStep} ref={mentorRef} variant="discovery" step={mentorStep} userType={project.userType} initialMessage={mentorMessage} placeholder={mentorPlaceholder} initialMessages={project.mentorChats?.[mentorStep]} onBusyChange={setChatBusy} onMessagesChange={(messages) => {
              try { const latest = getProject(projectId); if (latest) updateProject(projectId, { mentorChats: { ...latest.mentorChats, [mentorStep]: messages } }); }
              catch { setNotice("AI 대화를 저장하지 못했어요. 브라우저 저장 공간을 확인해주세요."); }
            }} />
          </section>
          <footer className={base.footer}>
            <div><span>이번 단계의 목표</span><p>{config.goal}</p><button className={styles.previous} disabled={busy || chatBusy || navigating} onClick={() => void navigate(href(previous.route))}><ArrowLeft size={13} /> 이전: {previous.label}</button></div>
            {onNext ? <button className={base.primary} disabled={busy || chatBusy || navigating} onClick={() => void onNext()}>{nextLabel ?? "다음 단계"}<ArrowRight size={15} /></button> : <button className={base.primary} disabled={busy || chatBusy || navigating} onClick={() => void navigate(dashboardHref)}>프로젝트 목록<ArrowRight size={15} /></button>}
          </footer>
        </main>
      </div>
      <Dialog.Root open={helpOpen} onOpenChange={setHelpOpen}><Dialog.Portal><Dialog.Overlay className={base.overlay} /><Dialog.Content className={base.dialog}><p className={base.eyebrow}>STEP {String(step).padStart(2, "0")} 사용 가이드</p><Dialog.Title>{STEPS[step - 1].label}, 이렇게 진행해요.</Dialog.Title><Dialog.Description>{config.goal}</Dialog.Description><ol className={base.helpSteps}>{config.steps.map((item) => <li key={item[0]}><strong>{item[0]}</strong><p>{item[2]}</p></li>)}</ol><Dialog.Close className={base.close} aria-label="사용 가이드 닫기"><X size={19} /></Dialog.Close><div className={base.dialogActions}><Dialog.Close className={base.primary}>이해했어요</Dialog.Close></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    </div>
  );
}
