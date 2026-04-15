"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import AiChat, { type AiChatHandle } from "@/components/ai-assistant/AiChat";
import StepIndicator from "@/components/progress-tracker/StepIndicator";
import EmptyContentModal from "@/components/EmptyContentModal";
import { Save, ArrowRight, ArrowLeft, Check, Download, FileText, CheckCircle, Wand2 } from "lucide-react";
import MobileChatSheet, { type MobileChatSheetHandle } from "@/components/mobile/MobileChatSheet";
import { getProject, updateProject, type Episode, type Project, type Character } from "@/lib/storage";
import { downloadProposalScript } from "@/lib/download";
import { saveProjectToDir } from "@/lib/fileStorage";

function FeatureListPanel({ episodes }: { episodes: Episode[] }) {
  if (episodes.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-[#EBE7E0] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-[#1A1A1A]">기능 목록</span>
        <span className="text-[10px] text-[#ADA8A0]">{episodes.length}개</span>
      </div>
      <div className="space-y-1">
        {episodes.map((ep, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FBF9F6] border border-[#EBE7E0]"
          >
            <div className="w-4 h-4 rounded-full bg-[#D4547A]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] font-bold text-[#D4547A]">{ep.episodeNumber}</span>
            </div>
            <span className="text-xs text-[#1A1A1A] truncate flex-1">
              {ep.title || `기능 ${ep.episodeNumber}`}
            </span>
            {ep.isCompleted && <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function CharacterPanel({ characters }: { characters: Character[] }) {
  const [open, setOpen] = useState(true);
  if (characters.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-[#EBE7E0] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden mb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F1EC] transition-colors"
      >
        <span className="text-xs font-bold text-[#1A1A1A]">이해관계자</span>
        <span className="text-[10px] text-[#ADA8A0]">{characters.length}명</span>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {characters.map((ch, i) => (
            <div key={i} className="flex items-start gap-2 px-2.5 py-2 rounded-xl bg-[#FBF9F6] border border-[#EBE7E0]">
              <div className="w-5 h-5 rounded-full bg-[#D4547A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[8px] font-bold text-[#D4547A]">{(ch.name || "?")[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1A1A1A] leading-tight">{ch.name || "이름 없음"}</p>
                <p className="text-[10px] text-[#7A7067] leading-tight">{ch.role}{ch.age ? ` · ${ch.age}` : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [proposalScript, setProposalScript] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const aiChatRef = useRef<AiChatHandle>(null);
  const mobileChatRef = useRef<MobileChatSheetHandle>(null);

  useEffect(() => {
    const p = getProject(id);
    if (p) {
      const updatedStep = Math.max(5, p.currentStep);
      updateProject(id, { currentStep: updatedStep });
      setProject({ ...p, currentStep: updatedStep });
      setProposalScript(p.proposalScript ?? "");
    }
  }, [id]);

  const save = async () => {
    setSaving(true);
    updateProject(id, {
      proposalScript,
      currentStep: Math.max(5, project?.currentStep ?? 1),
    });
    await saveProjectToDir(id, getProject(id));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const goNext = async () => {
    if (!proposalScript.trim()) { setShowEmptyModal(true); return; }
    updateProject(id, {
      proposalScript,
      currentStep: Math.max(5, project?.currentStep ?? 1),
    });
    await saveProjectToDir(id, getProject(id));
    router.push(`/project/${id}/submit`);
  };

  const goNextAnyway = async () => {
    setShowEmptyModal(false);
    updateProject(id, {
      proposalScript,
      currentStep: Math.max(5, project?.currentStep ?? 1),
    });
    await saveProjectToDir(id, getProject(id));
    router.push(`/project/${id}/submit`);
  };

  const autofill = async () => {
    if (!project?.ideaChat || project.ideaChat.length === 0) {
      alert("먼저 아이디어 발굴 단계에서 AI와 대화해주세요!");
      return;
    }
    setAutofilling(true);
    try {
      const res = await fetch("/api/ai/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaChat: project.ideaChat, step: "script" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.script) {
        setProposalScript(data.script);
      }
    } catch {
      alert("자동채우기에 실패했어요. 다시 시도해주세요.");
    } finally {
      setAutofilling(false);
    }
  };

  const charCount = proposalScript.length;
  const lineCount = proposalScript ? proposalScript.split("\n").length : 0;

  return (
    <div className="min-h-screen bg-[#FBF9F6]">
      {showEmptyModal && (
        <EmptyContentModal
          title="기획서 내용이 비어있어요"
          description="기획서를 작성해야 다음 단계로 넘어갈 수 있어요. AI 자동채우기로 초안을 먼저 생성하거나 AI 멘토에게 도움을 요청해봐요!"
          autofilling={autofilling}
          onAutofill={() => { setShowEmptyModal(false); autofill(); }}
          onAskMentor={() => { setShowEmptyModal(false); aiChatRef.current?.focusInput(); mobileChatRef.current?.openAndFocus(); }}
          onGoAnyway={goNextAnyway}
          onClose={() => setShowEmptyModal(false)}
        />
      )}
      <header className="bg-white border-b border-[#EBE7E0] px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-[#ADA8A0] hover:text-[#7A7067] transition-colors flex-shrink-0"
            >
              <img src="/plancraft-logo-remove.png" className="w-3.5 h-3.5 rounded object-cover" alt="" /> 대시보드
            </Link>
            <span className="text-[#EBE7E0]">/</span>
            <span className="text-xs font-semibold text-[#1A1A1A] truncate">{project?.title ?? "..."}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={autofill}
              disabled={autofilling}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-[#D4547A]/30 text-[#D4547A] hover:bg-[#D4547A]/5 transition-all duration-200 disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5" /> {autofilling ? "채우는 중..." : "AI 자동채우기"}
            </button>
            {project && (
              <button
                onClick={() => downloadProposalScript({ ...project, proposalScript })}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5" /> 기획서 다운로드
              </button>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full bg-[#D4547A] text-white hover:bg-[#B8405F] transition-all duration-300 disabled:opacity-50"
            >
              {saved ? <><Check className="w-3.5 h-3.5" /> 저장됨</> : saving ? "저장 중..." : <><Save className="w-3.5 h-3.5" /> 저장</>}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-4 md:gap-5">
        {/* Left sidebar */}
        <aside className="hidden md:flex md:flex-col w-52 flex-shrink-0 space-y-3 sticky top-20 self-start">
          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <StepIndicator currentStep={project?.currentStep ?? 1} projectId={id} isCompleted={project?.isCompleted} />
          </div>

          <FeatureListPanel episodes={project?.episodes ?? []} />
        </aside>

        <main className="flex-1 min-w-0 space-y-4 pb-20 lg:pb-0">
          <div>
            <p className="text-[10px] font-medium text-[#D4547A] uppercase tracking-widest mb-1">Step 05</p>
            <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">기획서 내용 작성</h1>
          </div>

          {/* 기획서 내용 */}
          <div className="bg-white rounded-2xl border border-[#EBE7E0] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#EBE7E0]">
              <FileText className="w-4 h-4 text-[#D4547A]" />
              <span className="text-sm font-bold text-[#1A1A1A]">기획서 내용</span>
            </div>
            <div className="p-5">
              <p className="text-[10px] text-[#ADA8A0] mb-3">
                지금까지 정리한 내용을 바탕으로 완성된 기획서를 작성해봐요. 왼쪽 기능 목록을 참고하세요.
              </p>
              <Textarea
                placeholder={`기획서를 작성해주세요.\n\n예시:\n[배경 및 필요성]\n매년 학교 급식에서 발생하는 잔반량은 전국적으로 ...\n\n[해결 방안]\n본 SW는 학생 식단 선호 데이터를 수집하여 ...\n\n[핵심 기능]\n1. 식단 추천 — 학생 선호도 기반 개인화 추천\n2. 잔반 분석 — 섭취량 추적 및 통계 제공\n\n[기대 효과]\n잔반량 30% 감소, 급식 만족도 향상 ...`}
                value={proposalScript}
                onChange={(e) => setProposalScript(e.target.value)}
                rows={26}
                className="font-mono text-xs"
              />
              <div className="flex justify-end mt-2 gap-3 text-[10px] text-[#ADA8A0]">
                <span>{lineCount}줄</span>
                <span>{charCount.toLocaleString()}자</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <Link href={`/project/${id}/episodes`}>
              <button className="flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200">
                <ArrowLeft className="w-3.5 h-3.5" /> 이전: 기능 설계
              </button>
            </Link>
            <div className="flex gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="text-xs font-medium px-4 py-2.5 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200 disabled:opacity-50"
              >
                저장
              </button>
              <button onClick={goNext} className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-[#D4547A] text-white hover:bg-[#B8405F] transition-all duration-300">
                다음: 제출 준비 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </main>

        <aside className="hidden lg:flex w-72 flex-shrink-0 sticky top-20 flex-col gap-3" style={{ height: "calc(100vh - 5rem)" }}>
          <CharacterPanel characters={project?.characters ?? []} />
          <div className="flex-1 min-h-0">
            <AiChat
              ref={aiChatRef}
              step="script"
              initialMessage="기획서 작성을 도와드릴게요! 배경 및 필요성, 해결 방안, 핵심 기능, 기대 효과 순서로 작성하면 논리적인 기획서가 완성돼요."
              placeholder="기획서 작성에 대해 질문하세요..."
            />
          </div>
        </aside>
      </div>

      <MobileChatSheet
        ref={mobileChatRef}
        step="script"
        initialMessage="기획서 작성을 도와드릴게요! 배경 및 필요성, 해결 방안, 핵심 기능, 기대 효과 순서로 작성하면 논리적인 기획서가 완성돼요."
        placeholder="기획서 작성에 대해 질문하세요..."
      />
    </div>
  );
}
