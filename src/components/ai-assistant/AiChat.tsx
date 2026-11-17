"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Send, User, Bot, Mic, MicOff, ArrowUp, Sparkles } from "lucide-react";
import Image from "next/image";
import discovery from "./discovery.module.css";
import { type UserType } from "@/lib/storage";

type Message = { role: "user" | "assistant"; content: string };

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`{3}[\s\S]*?`{3}/g, "")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface AiChatHandle {
  focusInput: () => void;
  setDraft: (text: string) => void;
}

interface AiChatProps {
  step: string;
  variant?: "default" | "discovery";
  ideaFocus?: "problem" | "context" | "summary";
  onBusyChange?: (busy: boolean) => void;
  userType?: UserType;
  placeholder?: string;
  initialMessage?: string;
  initialMessages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
}

const AiChat = forwardRef<AiChatHandle, AiChatProps>(function AiChat(
  { step, variant = "default", ideaFocus, onBusyChange, userType = "student", placeholder, initialMessage, initialMessages, onMessagesChange },
  ref
) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialMessages && initialMessages.length > 0) return initialMessages;
    if (initialMessage) return [{ role: "assistant", content: initialMessage }];
    return [];
  });
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(false);

  useImperativeHandle(ref, () => ({
    setDraft: (text: string) => { setInput(text); inputRef.current?.focus(); },
    focusInput: () => {
      inputRef.current?.focus();
      if (variant === "default") inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
  }));

  useEffect(() => {
    if (variant === "discovery") {
      const thread = threadRef.current;
      if (thread) thread.scrollTop = thread.scrollHeight;
    } else bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, variant]);

  useEffect(() => () => {
    manualStopRef.current = true;
    recognitionRef.current?.abort();
    requestRef.current?.abort();
  }, []);

  const startRecognition = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const lastIndex = e.results.length - 1;
      const transcript = e.results[lastIndex][0].transcript as string;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => {
      // continuous 모드에서도 브라우저가 강제 종료할 경우 재시작
      if (!manualStopRef.current) {
        startRecognition();
      } else {
        setIsListening(false);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      if (e.error === "no-speech") return; // 묵음은 무시하고 계속 청취
      manualStopRef.current = true;
      setIsListening(false);
      setError(e.error === "not-allowed" ? "마이크 사용이 허용되지 않았어요. 브라우저의 마이크 권한을 확인해주세요." : "음성 입력이 중단되었어요. 다시 시작해주세요.");
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {
      manualStopRef.current = true;
      setIsListening(false);
      setError("음성 입력을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const toggleListening = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!w.SpeechRecognition && !w.webkitSpeechRecognition) { setError("이 브라우저에서는 음성 입력을 지원하지 않아요. 키보드로 입력해주세요."); return; }

    if (isListening) {
      manualStopRef.current = true;
      recognitionRef.current?.stop();
      return;
    }

    manualStopRef.current = false;
    setIsListening(true);
    startRecognition();
  };

  const send = async (retry = false) => {
    if ((!retry && !input.trim()) || loading) return;
    const next: Message[] = retry ? messages : [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    onMessagesChange?.(next);
    if (!retry) setInput("");
    setError("");
    setLoading(true);
    onBusyChange?.(true);
    const controller = new AbortController();
    requestRef.current = controller;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, step, userType, ...(ideaFocus ? { ideaFocus } : {}) }),
      });
      const data = await res.json();
      if (!res.ok || typeof data.reply !== "string") throw new Error(data.error || "AI 응답을 받지 못했어요. 잠시 후 다시 시도해주세요.");
      const newMessages = [...next, { role: "assistant" as const, content: stripMarkdown(data.reply) }];
      setMessages(newMessages);
      onMessagesChange?.(newMessages);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "연결하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
      onBusyChange?.(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };


  if (variant === "discovery") {
    return (
      <section className={discovery.discovery} aria-label="아이디어봇과 대화">
        <div className={discovery.header}>
          <div className={discovery.agent}>
            <Image src="/ideabot-remove.png" width={27} height={27} alt="" unoptimized />
            <strong>아이디어봇과 함께</strong><span>AI 멘토</span>
          </div>
          {messages.length > 1 && <button className={discovery.expand} aria-expanded={expanded} aria-controls="discovery-thread" onClick={() => setExpanded(!expanded)}>{expanded ? "대화 영역 줄이기" : "대화 영역 넓히기"}</button>}
        </div>
        <div id="discovery-thread" ref={threadRef} className={discovery.thread + (expanded ? " " + discovery.expanded : "")} role="log" aria-label="AI 멘토와의 대화" aria-live="polite" aria-busy={loading} tabIndex={0}>
          <div className={discovery.messages}>
            {messages.map((message, index) => message.role === "user"
              ? <div key={index} className={discovery.user}>{message.content}</div>
              : <div key={index}><div className={discovery.role}><span><Sparkles size={12} /></span>아이디어봇</div><div className={discovery.assistantText}>{message.content}</div></div>
            )}
            {loading && <div className={discovery.loading} role="status"><span /> 생각을 정리하고 있어요…</div>}
          </div>
        </div>
        {error && <div className={discovery.error} role="alert"><span>{error}</span>{messages.at(-1)?.role === "user" && <button disabled={loading} onClick={() => send(true)}>다시 시도</button>}</div>}
        <div className={discovery.composer}>
          <label className="sr-only" htmlFor="discovery-input">AI 멘토에게 보낼 메시지</label>
          <textarea id="discovery-input" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} className={discovery.input} rows={2} maxLength={20000} />
          <div className={discovery.composerBottom}>
            <span>Enter 전송 · Shift + Enter 줄바꿈</span>
            <div className={discovery.actions}>
              <button type="button" onClick={toggleListening} className={discovery.mic} aria-label={isListening ? "녹음 중지" : "음성 입력"} aria-pressed={isListening}>{isListening ? <MicOff size={16} /> : <Mic size={16} />}</button>
              <button onClick={() => send()} disabled={loading || !input.trim()} className={discovery.send} aria-label="메시지 보내기"><ArrowUp size={17} /></button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#EBE7E0] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#EBE7E0] bg-[#FBF9F6]">
        <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
          <img src="/ideabot-remove.png" className="w-8 h-8 object-cover" alt="아이디어봇" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#1A1A1A]">AI 멘토 아이디어봇</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <p className="text-[10px] text-[#ADA8A0]">기획을 함께 정리해요</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div role="log" aria-label="AI 멘토와의 대화" aria-live="polite" className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[#FBF9F6]">
        {messages.length === 0 && (
          <div className="text-center mt-8">
            <div className="w-12 h-12 rounded-2xl overflow-hidden mx-auto mb-3">
              <img src="/ideabot-remove.png" className="w-12 h-12 object-cover" alt="아이디어봇" />
            </div>
            <p className="text-xs text-[#ADA8A0]">궁금한 점을 편하게 물어봐요!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.role === "user" ? "bg-[#B8405F]" : "bg-[#D4547A]"}`}>
              {msg.role === "user"
                ? <User className="w-3 h-3 text-white" />
                : <Bot className="w-3 h-3 text-white" />
              }
            </div>
            <div className={`max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[#D4547A] text-white rounded-tr-sm"
                : "bg-white text-[#1A1A1A] rounded-tl-sm border border-[#EBE7E0] shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#D4547A] flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-white border border-[#EBE7E0] rounded-2xl rounded-tl-sm px-3.5 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-[#D4547A] rounded-full animate-bounce [animation-delay:0ms] opacity-60" />
                <span className="w-1.5 h-1.5 bg-[#D4547A] rounded-full animate-bounce [animation-delay:150ms] opacity-60" />
                <span className="w-1.5 h-1.5 bg-[#D4547A] rounded-full animate-bounce [animation-delay:300ms] opacity-60" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-t border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-800"><span>{error}</span>{messages.at(-1)?.role === "user" && <button type="button" disabled={loading} onClick={() => send(true)} className="font-semibold underline underline-offset-4 disabled:opacity-40">다시 시도</button>}</div>}

      {/* Input */}
      <div className="p-3 border-t border-[#EBE7E0] bg-white">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={inputRef}
            aria-label="AI 멘토에게 보낼 메시지"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? "Enter로 전송, Shift+Enter로 줄바꿈"}
            className="resize-none min-h-[52px] max-h-[100px] text-xs"
            rows={2}
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isListening
                ? "bg-red-500 animate-pulse"
                : "bg-[#EBE7E0] hover:bg-[#D4547A] group"
            }`}
            title={isListening ? "녹음 중지" : "음성 입력"}
            aria-label={isListening ? "녹음 중지" : "음성 입력"}
            aria-pressed={isListening}
          >
            {isListening
              ? <MicOff className="w-3.5 h-3.5 text-white" />
              : <Mic className="w-3.5 h-3.5 text-[#7A7067] group-hover:text-white" />
            }
          </button>
          <button
            onClick={() => send()}
            aria-label="메시지 보내기"
            disabled={loading || !input.trim()}
            className="w-9 h-9 flex-shrink-0 rounded-xl bg-[#D4547A] flex items-center justify-center hover:bg-[#B8405F] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default AiChat;
