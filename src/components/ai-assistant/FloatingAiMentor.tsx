"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import AiChat, { type AiChatHandle } from "./AiChat";
import type { Project } from "@/lib/storage";
import type { PromptStep } from "@/lib/prompts";
import { STEPS } from "@/lib/utils";
import styles from "./floating.module.css";

const SUGGESTIONS = {
  story: ["문제를 더 구체적으로 정의하고 싶어요.", "문제와 해결 방향이 잘 연결되는지 봐주세요."],
  character: ["놓친 이해관계자가 있는지 봐주세요.", "사용자의 불편함을 구체화하고 싶어요."],
  panel: ["꼭 필요한 기능부터 정리하고 싶어요.", "기능의 입력·처리·출력 흐름을 검토해주세요."],
  script: ["기획서에서 모호한 표현을 찾아주세요.", "문제와 기능, 기대 효과가 연결되는지 봐주세요."],
  completion: ["기획서에서 보완할 부분을 짚어주세요.", "첫 구현의 범위를 어떻게 잡으면 좋을까요?"],
} as const;

type Props = {
  project: Project;
  step: 2 | 3 | 4 | 5 | 6;
  mentorStep: Exclude<PromptStep, "idea">;
  initialMessage: string;
  placeholder: string;
  context: string;
  onBusyChange: (busy: boolean) => void;
  onMessagesChange: (messages: { role: "user" | "assistant"; content: string }[]) => void;
};

const FloatingAiMentor = forwardRef<AiChatHandle, Props>(function FloatingAiMentor(
  { project, step, mentorStep, initialMessage, placeholder, context, onBusyChange, onMessagesChange }, ref
) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(false);
  const chatRef = useRef<AiChatHandle>(null);
  const openRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();

  function openChat() { openRef.current = true; setUnread(false); setOpen(true); }
  function closeChat() { openRef.current = false; setOpen(false); triggerRef.current?.focus(); }

  useImperativeHandle(ref, () => ({
    focusInput: () => { openChat(); chatRef.current?.focusInput(); },
    setDraft: (text) => { openChat(); chatRef.current?.setDraft(text); },
  }));

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => chatRef.current?.focusInput());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return <>
    <section id={panelId} className={styles.panel} hidden={!open} role="dialog" aria-labelledby={titleId} aria-describedby={panelId + "-description"} onKeyDown={(event) => {
      if (event.key === "Escape" && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); closeChat(); }
    }}>
      <header className={styles.header}>
        <Image src="/ideabot-remove.png" width={36} height={36} alt="" unoptimized />
        <div><h2 id={titleId}>아이디어봇</h2><p>STEP {String(step).padStart(2, "0")} · {STEPS[step - 1].label}</p></div>
        <button type="button" onClick={closeChat} aria-label="AI 도움 창 닫기" title="닫기 (Esc)"><X size={20} /></button>
      </header>
      <p id={panelId + "-description"} className={styles.description}>작성 중인 기획을 참고해 함께 고민해요. 답변을 보고 직접 다듬어보세요.</p>
      <div className={styles.suggestions} aria-label="추천 질문">{SUGGESTIONS[mentorStep].map((text) => <button type="button" key={text} onClick={() => chatRef.current?.setDraft(text)}>{text}</button>)}</div>
      <AiChat ref={chatRef} variant="floating" active={open} step={mentorStep} userType={project.userType} projectContext={context} initialMessage={initialMessage} placeholder={placeholder} initialMessages={project.mentorChats?.[mentorStep]} onBusyChange={(value) => { setBusy(value); onBusyChange(value); }} onMessagesChange={(messages) => {
        if (!openRef.current && messages.at(-1)?.role === "assistant") setUnread(true);
        onMessagesChange(messages);
      }} />
    </section>
    <button ref={triggerRef} type="button" className={styles.launcher} onClick={() => open ? closeChat() : openChat()} aria-expanded={open} aria-controls={panelId} aria-haspopup="dialog" aria-label={open ? "AI 도움 창 접기" : unread ? "AI 답변 확인하기" : "AI 도움 받기"} title={open ? "AI 도움 창 접기" : unread ? "AI 답변 확인하기" : "AI 도움 받기"}>
      <span className={styles.avatar}><Image src="/ideabot-remove.png" width={64} height={64} alt="" unoptimized />{(busy || unread) && <span className={styles.indicator} />}</span>
      <span className="sr-only" aria-live="polite">{open ? "도움 창 접기" : busy ? "생각 중…" : unread ? "답변 도착" : "AI 도움"}</span>
    </button>
  </>;
});

export default FloatingAiMentor;
