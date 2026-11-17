"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, BookOpen, Check, ChevronRight, Loader2, X } from "lucide-react";
import AiChat, { type AiChatHandle } from "@/components/ai-assistant/AiChat";
import { getProject, updateProject, type ChatMessage } from "@/lib/storage";
import { useProject } from "@/lib/use-project";
import { saveProjectToDir } from "@/lib/fileStorage";
import { STEPS } from "@/lib/utils";
import styles from "./idea.module.css";

const GUIDE = [
  {
    label: "불편함 이야기",
    title: "불편함 하나부터 이야기해보세요.",
    description: "최근 학교·업무·일상에서 반복해서 불편했던 일을 적어보세요.",
    example: "예: 학교 알림이 흩어져 중요한 공지를 놓쳐요.",
    focus: "problem",
    placeholder: "그때의 상황을 편하게 이야기해주세요.",
  },
  {
    label: "사용자·상황 구체화",
    title: "누가, 어떤 상황에서 불편했나요?",
    description: "아이디어봇과 대화하며 해결할 대상과 상황을 좁혀보세요.",
    example: "예: 학부모가 체험학습 신청 기한을 놓쳤어요.",
    focus: "context",
    placeholder: "누가, 언제, 어떤 어려움을 겪었는지 이야기해주세요.",
  },
  {
    label: "아이디어 한 줄 정리",
    title: "누구의 어떤 문제인지, 한 줄로 정리해요.",
    description: "아래 한 줄 정리를 직접 다듬고, 문제 정의 단계로 이어가세요.",
    example: "예: 학부모가 필요한 학교 공지를 한곳에서 확인하는 서비스",
    focus: "summary",
    placeholder: "아이디어봇과 해결하고 싶은 문제를 함께 정리해보세요.",
  },
] as const;

export default function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const project = useProject(id);
  const chatRef = useRef<AiChatHandle>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const stage = project?.ideaStage ?? (project?.story.logline.trim() ? 2 : 0);
  const guide = GUIDE[stage];
  const userType = project?.userType ?? "student";
  const dashboardHref = userType === "general" ? "/dashboard?type=general" : "/dashboard?type=student";
  const hasConversation = project?.ideaChat?.some((message) => message.role === "user") ?? false;
  const prompts = userType === "general"
    ? [
        ["학교 알림을 자주 놓쳐요", "학교 알림이 여러 채널에 흩어져 중요한 공지를 놓쳐요."],
        ["자료를 찾기 어려워요", "수업이나 업무에 필요한 자료를 찾는 데 시간이 오래 걸려요."],
      ]
    : [
        ["학교에서 불편한 일이 있어요", "학교생활에서 반복해서 불편했던 일을 해결하고 싶어요."],
        ["일상의 작은 문제를 바꾸고 싶어요", "일상에서 겪는 불편함을 SW로 해결하고 싶어요."],
      ];

  function chooseStage(next: 0 | 1 | 2) {
    try {
      updateProject(id, { ideaStage: next });
      setError("");
    } catch {
      setError("안내 위치를 저장하지 못했어요. 브라우저 저장 공간을 확인해주세요.");
    }
  }

  function saveMessages(messages: ChatMessage[]) {
    try {
      updateProject(id, { ideaChat: messages });
      setError("");
    } catch {
      setError("대화를 브라우저에 저장하지 못했어요. 페이지를 닫기 전에 저장 공간을 확인해주세요.");
    }
  }

  function saveLogline(value: string) {
    const latest = getProject(id);
    if (!latest) return;
    try {
      updateProject(id, { story: { ...latest.story, logline: value } });
      setError("");
    } catch {
      setError("한 줄 정리를 저장하지 못했어요. 페이지를 닫기 전에 저장 공간을 확인해주세요.");
    }
  }

  async function goNext() {
    if (busy || saving) return;
    const latest = getProject(id);
    if (!latest) return;
    setSaving(true);
    setError("");
    try {
      updateProject(id, { currentStep: Math.max(2, latest.currentStep) });
      await saveProjectToDir(id, getProject(id));
      router.push("/project/" + encodeURIComponent(id) + "/story");
    } catch {
      setSaving(false);
      setError("저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  function requestNext() {
    if (!getProject(id)?.story.logline.trim()) setConfirmOpen(true);
    else void goNext();
  }

  if (project === undefined) return <main className={styles.status} role="status">프로젝트를 불러오고 있어요.</main>;
  if (project === null) return (
    <main className={styles.status}>
      <h1>프로젝트를 찾을 수 없어요</h1>
      <p>이 브라우저에 저장된 프로젝트인지 확인해주세요.</p>
      <Link href="/dashboard" className={styles.primary}>프로젝트 목록으로</Link>
    </main>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={dashboardHref} className={styles.brand} aria-label="PlanCraft 프로젝트 목록">
          <Image src="/plancraft-logo-remove.png" width={29} height={29} alt="" unoptimized />
          <span>PlanCraft</span>
        </Link>
        <div className={styles.breadcrumb}>
          <Link href={dashboardHref}>내 작업 공간</Link>
          <ChevronRight size={13} aria-hidden="true" />
          <span>{project.title}</span>
        </div>
        <span className={styles.storageNote}><span /> 이 브라우저에 저장</span>
        <span className={styles.mobileStage}>아이디어 발굴 · 1 / 6</span>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <p className={styles.sidebarLabel}>나의 기획 여정</p>
          <nav className={styles.steps} aria-label="기획 단계">
            {STEPS.map((step) => {
              const available = step.id <= project.currentStep || project.isCompleted;
              const content = <><span className={styles.stepNumber}>{String(step.id).padStart(2, "0")}</span><span>{step.label}</span></>;
              return available
                ? <Link key={step.id} href={"/project/" + encodeURIComponent(id) + "/" + step.route} className={step.id === 1 ? styles.activeStep : undefined} aria-current={step.id === 1 ? "step" : undefined}>{content}</Link>
                : <span key={step.id} className={styles.futureStep}>{content}</span>;
            })}
          </nav>
          <div className={styles.sidebarBottom}>
            <button onClick={() => setHelpOpen(true)}><BookOpen size={14} /> 막막할 때, 사용 가이드</button>
            <p>완벽한 생각이 아니어도 좋아요.<br />시작은 늘 작은 발견이니까요.</p>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>STEP 01 · 생각을 꺼내는 시간</p>
              <h1>아이디어 발굴</h1>
              <p className={styles.description}>막연한 생각을, 개발에 쓸 수 있는 아이디어의 출발점으로 정리해요.</p>
            </div>
            <button className={styles.helpButton} onClick={() => setHelpOpen(true)}><BookOpen size={14} /> 사용 방법</button>
          </div>

          <ol className={styles.flow} aria-label="아이디어 발굴 사용 안내">
            {GUIDE.map((item, index) => (
              <li key={item.focus}>
                <button onClick={() => chooseStage(index as 0 | 1 | 2)} aria-current={stage === index ? "step" : undefined}>
                  <span>{index + 1}</span>{item.label}
                </button>
              </li>
            ))}
          </ol>

          <section className={styles.task} aria-labelledby="idea-task-title">
            <p className={styles.taskLabel}>지금 할 일 <span>{String(stage + 1).padStart(2, "0")} / 03</span></p>
            <h2 id="idea-task-title">{guide.title}</h2>
            <p className={styles.taskDescription}>{guide.description}</p>
            {stage === 0 && (
              <div className={styles.prompts}>
                {[...prompts, ["아직 아이디어가 없어요", "아직 아이디어가 없어요. 일상에서 문제를 찾는 것부터 도와주세요."]].map(([label, prompt]) => (
                  <button key={label} onClick={() => chatRef.current?.setDraft(prompt)}>{label} <ArrowRight size={13} /></button>
                ))}
              </div>
            )}
            <details className={styles.answerGuide} key={stage}>
              <summary>어떻게 답하면 좋나요?</summary>
              <p>누가 · 언제 · 어떤 불편함을 겪었는지 짧게 이야기하세요. 처음부터 해결 방법이나 기능을 정할 필요는 없어요.</p>
              <p className={styles.example}>{guide.example}</p>
            </details>
            {hasConversation && stage < 2 && (
              <button className={styles.nextGuide} onClick={() => chooseStage((stage + 1) as 1 | 2)}>
                {stage === 0 ? "주제를 골랐다면, 사용자와 상황 구체화" : "생각이 정리됐다면, 한 줄로 정리하기"} <ArrowRight size={13} />
              </button>
            )}
          </section>

          <AiChat
            key={id}
            ref={chatRef}
            variant="discovery"
            step="idea"
            ideaFocus={guide.focus}
            userType={userType}
            initialMessage={userType === "general"
              ? "해결하고 싶은 불편함 하나부터 시작해볼까요?\n떠오르는 생각을 적거나, 위의 예시를 눌러 시작해보세요."
              : "어떤 불편함을 SW로 바꿔보고 싶나요?\n사소한 경험도 좋아요. 떠오르는 생각을 적거나 위의 예시를 눌러봐요."}
            initialMessages={project.ideaChat}
            onMessagesChange={saveMessages}
            onBusyChange={setBusy}
            placeholder={guide.placeholder}
          />

          {(stage === 2 || !!project.story.logline.trim()) && (
            <section className={styles.result} aria-labelledby="idea-summary-title">
              <div><span>이번 단계의 결과</span><h2 id="idea-summary-title">아이디어 한 줄 정리</h2></div>
              <label className={styles.summaryLabel} htmlFor="idea-logline">누구의 어떤 문제를 해결하는 서비스인가요?</label>
              <textarea id="idea-logline" value={project.story.logline} onChange={(event) => saveLogline(event.target.value)} placeholder="예: 학부모가 필요한 학교 공지를 한곳에서 확인하는 서비스" rows={2} />
              <p>직접 정리한 이 문장은 다음 단계의 ‘아이디어 한 줄 소개’로 이어집니다.</p>
            </section>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}
          <footer className={styles.footer}>
            <div><span>이번 단계의 목표</span><p>누구의 어떤 불편함을 해결할지, 한 문장으로 정리하기</p></div>
            <button className={styles.primary} onClick={requestNext} disabled={busy || saving}>
              {saving ? <><Loader2 size={15} className="animate-spin" /> 저장 중</> : <>다음: 문제 정의 <ArrowRight size={15} /></>}
            </button>
          </footer>
        </main>
      </div>

      <Dialog.Root open={helpOpen} onOpenChange={setHelpOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.dialog}>
            <p className={styles.eyebrow}>STEP 01 사용 가이드</p>
            <Dialog.Title>이렇게 시작해보세요.</Dialog.Title>
            <Dialog.Description>아이디어봇과 대화하고, 개발할 아이디어의 출발점을 한 줄로 남기는 단계예요.</Dialog.Description>
            <ol className={styles.helpSteps}>
              <li><strong>불편함 하나 이야기하기</strong><p>직접 경험한 일을 짧게 적어요. 막막하다면 화면의 예시를 눌러 시작해보세요.</p></li>
              <li><strong>질문에 답하며 구체화하기</strong><p>누가, 언제, 어떤 불편함을 겪는지 좁혀가요. 안내 위치는 직접 앞뒤로 이동할 수 있어요.</p></li>
              <li><strong>한 줄 정리 후 다음 단계로</strong><p>누구의 어떤 문제를 해결할지 직접 적어요. 문제 정의 단계에서 배경과 필요성을 다듬게 됩니다.</p></li>
            </ol>
            <Dialog.Close className={styles.close} aria-label="사용 가이드 닫기"><X size={19} /></Dialog.Close>
            <div className={styles.dialogActions}><Dialog.Close className={styles.primary}><Check size={15} /> 이해했어요</Dialog.Close></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.dialog}>
            <p className={styles.eyebrow}>다음 단계로 이어가기</p>
            <Dialog.Title>아이디어를 한 줄로 남겨볼까요?</Dialog.Title>
            <Dialog.Description>누구의 어떤 문제를 해결할지 한 문장으로 정리하면 다음 단계를 시작하기 쉬워요. 지금 대화는 이미 이 브라우저에 저장되어 있어요.</Dialog.Description>
            <Dialog.Close className={styles.close} aria-label="다음 단계 안내 닫기"><X size={19} /></Dialog.Close>
            <div className={styles.dialogActions}>
              <button className={styles.secondary} disabled={saving} onClick={() => { setConfirmOpen(false); void goNext(); }}>다음 단계에서 정리할게요</button>
              <button className={styles.primary} onClick={() => { chooseStage(2); setConfirmOpen(false); }}>여기서 한 줄 정리</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
