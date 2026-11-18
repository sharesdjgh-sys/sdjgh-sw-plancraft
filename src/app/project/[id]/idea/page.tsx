"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import JourneySidebar from "@/components/project-workspace/JourneySidebar";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, BookOpen, Check, Loader2, X } from "lucide-react";
import AiChat, { type AiChatHandle } from "@/components/ai-assistant/AiChat";
import { getProject, updateProject, type ChatMessage } from "@/lib/storage";
import { useProject } from "@/lib/use-project";
import { saveProjectToDir } from "@/lib/fileStorage";
import styles from "./idea.module.css";

const GUIDE = [
  {
    label: "불편함 이야기",
    detail: "직접 겪은 상황과 그때 불편했던 점을 아이디어봇에게 적어요. 주제가 떠오르지 않으면 예시 버튼을 눌러 대화를 시작하고, 기능을 정하기보다 경험을 설명해보세요.",
    example: "예: 학교 알림이 흩어져 중요한 공지를 놓쳐요.",
  },
  {
    label: "사용자·상황 구체화",
    detail: "아이디어봇의 질문에 답하며 누가, 언제, 어디서 어려움을 겪는지 좁혀가요. ‘모든 사람’ 대신 구체적인 사용자를 정하고, 문제가 생기는 상황을 하나 들어보세요.",
    example: "예: 학부모가 체험학습 신청 기한을 놓쳤어요.",
  },
  {
    label: "아이디어 한 줄 정리",
    detail: "대화에서 정리한 내용을 바탕으로 아래 입력란에 ‘누구의 어떤 문제를 해결하는 서비스인지’를 한 문장으로 적어요. 이 문장은 다음 단계의 한 줄 소개로 이어지며, 이후에도 수정할 수 있어요.",
    example: "예: 학부모가 필요한 학교 공지를 한곳에서 확인하는 서비스",
  },
] as const;

export default function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const project = useProject(id);
  const chatRef = useRef<AiChatHandle>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const focusSummaryOnClose = useRef(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    <div className={styles.page + " " + styles.workspacePage}>
      <header className={styles.header}>
        <Link href={dashboardHref} className={styles.brand} aria-label="PlanCraft 프로젝트 목록">
          <BrandMark />
        </Link>
        <span className={styles.mobileStage}>아이디어 발굴 · 1 / 6</span>
      </header>

      <div className={styles.layout + " " + styles.journeyLayout}>
        <JourneySidebar project={project} step={1} />

        <main className={styles.main}>
          <div className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>STEP 01 · 생각을 꺼내는 시간</p>
              <h1>아이디어 발굴</h1>
              <p className={styles.description}>불편했던 일을 이야기하면, 아이디어봇이 질문하며 함께 구체화해요.</p>
            </div>
            <button className={styles.helpButton} onClick={() => setHelpOpen(true)}><BookOpen size={14} /> 사용 방법</button>
          </div>

          {!hasConversation && <div className={styles.prompts} role="group" aria-label="대화를 시작하는 예시">
            {[...prompts, ["아직 아이디어가 없어요", "아직 아이디어가 없어요. 일상에서 문제를 찾는 것부터 도와주세요."]].map(([label, prompt]) => (
              <button key={label} onClick={() => chatRef.current?.setDraft(prompt)}>{label} <ArrowRight size={13} /></button>
            ))}
          </div>}

          <AiChat
            key={id}
            ref={chatRef}
            variant="discovery"
            step="idea"
            userType={userType}
            initialMessage={userType === "general"
              ? "해결하고 싶은 불편함 하나부터 시작해볼까요?\n떠오르는 생각을 적거나, 위의 예시를 눌러 시작해보세요."
              : "어떤 불편함을 SW로 바꿔보고 싶나요?\n사소한 경험도 좋아요. 떠오르는 생각을 적거나 위의 예시를 눌러봐요."}
            initialMessages={project.ideaChat}
            onMessagesChange={saveMessages}
            onBusyChange={setBusy}
            placeholder="해결하고 싶은 불편함을 편하게 이야기해주세요."
          />

          <section className={styles.result} aria-labelledby="idea-summary-title">
              <div><span>이번 단계의 결과</span><h2 id="idea-summary-title">아이디어 한 줄 정리</h2></div>
              <label className={styles.summaryLabel} htmlFor="idea-logline">누구의 어떤 문제를 해결하는 서비스인가요?</label>
              <textarea ref={summaryRef} id="idea-logline" value={project.story.logline} onChange={(event) => saveLogline(event.target.value)} placeholder="예: 학부모가 필요한 학교 공지를 한곳에서 확인하는 서비스" rows={2} />
              <p>직접 정리한 이 문장은 다음 단계의 ‘아이디어 한 줄 소개’로 이어집니다.</p>
          </section>

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
          <Dialog.Content className={styles.dialog + " " + styles.detailedHelp}>
            <p className={styles.eyebrow}>STEP 01 · 사용 방법</p>
            <Dialog.Title>이렇게 시작해보세요.</Dialog.Title>
            <Dialog.Description>아이디어봇과 대화하고, 개발할 아이디어의 출발점을 한 줄로 남기는 단계예요.</Dialog.Description>
            <ol className={styles.helpSteps}>
              {GUIDE.map((item) => <li key={item.label}><strong>{item.label}</strong><p>{item.detail}</p><p className={styles.helpExample}>{item.example}</p></li>)}
            </ol>
            <div className={styles.helpNote}><strong>저장과 다음 단계</strong><p>대화와 한 줄 정리는 이 브라우저에 자동 저장돼요. 단계 버튼을 누를 필요 없이 대화를 이어가고, 아래 한 줄 정리를 다듬은 뒤 ‘다음: 문제 정의’로 이어가세요.</p></div>
            <Dialog.Close className={styles.close} aria-label="사용 방법 닫기"><X size={19} /></Dialog.Close>
            <div className={styles.dialogActions}><Dialog.Close className={styles.primary}><Check size={15} /> 이해했어요</Dialog.Close></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.dialog} onCloseAutoFocus={(event) => {
            if (!focusSummaryOnClose.current) return;
            event.preventDefault();
            focusSummaryOnClose.current = false;
            summaryRef.current?.focus({ preventScroll: true });
            summaryRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
          }}>
            <p className={styles.eyebrow}>다음 단계로 이어가기</p>
            <Dialog.Title>아이디어를 한 줄로 남겨볼까요?</Dialog.Title>
            <Dialog.Description>누구의 어떤 문제를 해결할지 한 문장으로 정리하면 다음 단계를 시작하기 쉬워요. 지금 대화는 이미 이 브라우저에 저장되어 있어요.</Dialog.Description>
            <Dialog.Close className={styles.close} aria-label="다음 단계 안내 닫기"><X size={19} /></Dialog.Close>
            <div className={styles.dialogActions}>
              <button className={styles.secondary} disabled={saving} onClick={() => { setConfirmOpen(false); void goNext(); }}>다음 단계에서 정리할게요</button>
              <button className={styles.primary} onClick={() => { focusSummaryOnClose.current = true; setConfirmOpen(false); }}>여기서 한 줄 정리</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
