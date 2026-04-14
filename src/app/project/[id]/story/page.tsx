"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import AiChat, { type AiChatHandle } from "@/components/ai-assistant/AiChat";
import StepIndicator from "@/components/progress-tracker/StepIndicator";
import EmptyContentModal from "@/components/EmptyContentModal";
import { useRouter } from "next/navigation";
import { Save, ArrowRight, Check, Download, Wand2 } from "lucide-react";
import MobileChatSheet, { type MobileChatSheetHandle } from "@/components/mobile/MobileChatSheet";
import { getProject, updateProject, type Project } from "@/lib/storage";
import { downloadStory } from "@/lib/download";
import { saveProjectToDir } from "@/lib/fileStorage";

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [story, setStory] = useState({ logline: "", theme: "", setting: "", plotOutline: "", totalEpisodes: "1" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const aiChatRef = useRef<AiChatHandle>(null);
  const mobileChatRef = useRef<MobileChatSheetHandle>(null);

  useEffect(() => {
    const p = getProject(id);
    if (p) { setProject(p); setStory(p.story); }
  }, [id]);

  const save = async () => {
    setSaving(true);
    updateProject(id, {
      story: { ...story },
      currentStep: Math.max(2, project?.currentStep ?? 1),
    });
    await saveProjectToDir(id, getProject(id));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isEmpty = !story.logline.trim() && !story.theme.trim() && !story.setting.trim() && !story.plotOutline.trim();

  const goNext = async () => {
    if (isEmpty) { setShowEmptyModal(true); return; }
    updateProject(id, {
      story: { ...story },
      currentStep: Math.max(2, project?.currentStep ?? 1),
    });
    await saveProjectToDir(id, getProject(id));
    router.push(`/project/${id}/characters`);
  };

  const goNextAnyway = async () => {
    setShowEmptyModal(false);
    updateProject(id, {
      story: { ...story },
      currentStep: Math.max(2, project?.currentStep ?? 1),
    });
    await saveProjectToDir(id, getProject(id));
    router.push(`/project/${id}/characters`);
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
        body: JSON.stringify({ ideaChat: project.ideaChat, step: "story" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStory((s) => ({
        logline: data.logline ?? s.logline,
        theme: data.theme ?? s.theme,
        setting: data.setting ?? s.setting,
        plotOutline: data.plotOutline ?? s.plotOutline,
        totalEpisodes: data.totalEpisodes ?? s.totalEpisodes,
      }));
    } catch (e) {
      alert("자동채우기에 실패했어요. 다시 시도해주세요.");
    } finally {
      setAutofilling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6]">
      {showEmptyModal && (
        <EmptyContentModal
          title="문제 정의 내용이 비어있어요"
          description="아이디어 한 줄 소개, 해결하려는 문제 등 주요 내용을 하나 이상 작성해야 다음 단계로 넘어갈 수 있어요. 어려우면 AI 도움을 받아봐요!"
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
            <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-[#ADA8A0] hover:text-[#7A7067] transition-colors flex-shrink-0">
              <img src="/plancraft-logo-remove.png" className="w-3.5 h-3.5 rounded object-cover" alt="" /> 대시보드
            </Link>
            <span className="text-[#EBE7E0]">/</span>
            <span className="text-xs font-semibold text-[#1A1A1A] truncate">{project?.title ?? "..."}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {project && (
              <>
                <button
                  onClick={autofill}
                  disabled={autofilling}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-[#D4547A]/30 text-[#D4547A] hover:bg-[#D4547A]/5 transition-all duration-200 disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" /> {autofilling ? "채우는 중..." : "AI 자동채우기"}
                </button>
                <button
                  onClick={() => downloadStory({ ...project, story })}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5" /> 다운로드
                </button>
              </>
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
        <aside className="hidden md:block w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-4 sticky top-20 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <StepIndicator currentStep={project?.currentStep ?? 1} projectId={id} isCompleted={project?.isCompleted} />
          </div>
        </aside>

        <main className="flex-1 min-w-0 space-y-4 pb-20 lg:pb-0">
          <div className="mb-2">
            <p className="text-[10px] font-medium text-[#D4547A] uppercase tracking-widest mb-1">Step 02</p>
            <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">문제 정의</h1>
          </div>

          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">아이디어 한 줄 소개</label>
            <p className="text-[10px] text-[#ADA8A0] mb-3">심사위원이 읽었을 때 SW가 궁금해지는 한 문장</p>
            <Input placeholder="예: 급식 잔반 데이터를 분석해 학교 식단을 개선하는 AI 추천 시스템" value={story.logline} onChange={(e) => setStory((s) => ({ ...s, logline: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">해결하려는 문제</label>
              <p className="text-[10px] text-[#ADA8A0] mb-3">왜 이 문제가 중요한지, 현재 어떤 불편함이 있는지</p>
              <Textarea placeholder="어떤 사회적 문제 또는 불편함을 해결하려 하나요? 현재 상황과 문제의 심각성을 구체적으로 써봐요." value={story.theme} onChange={(e) => setStory((s) => ({ ...s, theme: e.target.value }))} rows={4} />
            </div>
            <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">배경 및 필요성</label>
              <p className="text-[10px] text-[#ADA8A0] mb-3">문제가 발생하는 환경, 관련 통계나 사례</p>
              <Textarea placeholder="문제가 발생하는 배경과 이 SW가 왜 필요한지 설명해주세요." value={story.setting} onChange={(e) => setStory((s) => ({ ...s, setting: e.target.value }))} rows={4} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">기능 개요</label>
            <p className="text-[10px] text-[#ADA8A0] mb-3">SW가 어떻게 문제를 해결하는지 전체적인 흐름을 정리해보세요</p>
            <Textarea
              placeholder={`문제 인식: 어떤 상황에서 SW가 필요한가\n해결 방식: SW가 어떻게 작동하는가\n주요 기능: 핵심 기능 목록\n기대 효과: 사용 후 어떤 변화가 생기는가`}
              value={story.plotOutline}
              onChange={(e) => setStory((s) => ({ ...s, plotOutline: e.target.value }))}
              rows={10}
            />
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#EBE7E0]">
              <label className="text-xs font-semibold text-[#1A1A1A] whitespace-nowrap">핵심 기능 수</label>
              <Input type="number" min="1" max="20" value={story.totalEpisodes} onChange={(e) => setStory((s) => ({ ...s, totalEpisodes: e.target.value }))} className="w-20" />
              <span className="text-xs text-[#ADA8A0]">개</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={save} disabled={saving} className="text-xs font-medium px-4 py-2.5 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200 disabled:opacity-50">
              저장
            </button>
            <button onClick={goNext} className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-[#D4547A] text-white hover:bg-[#B8405F] transition-all duration-300">
              다음: 이해관계자 분석 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </main>

        <aside className="hidden lg:flex w-72 flex-shrink-0 h-[calc(100vh-5rem)] sticky top-20">
          <AiChat ref={aiChatRef} step="story" initialMessage="문제 정의를 도와드릴게요! 해결하려는 문제의 핵심이 무엇인가요? 어떤 상황에서 불편함을 느꼈는지 편하게 말씀해 주세요." placeholder="문제 정의에 대해 질문하세요..." />
        </aside>
      </div>

      <MobileChatSheet
        ref={mobileChatRef}
        step="story"
        initialMessage="문제 정의를 도와드릴게요! 해결하려는 문제의 핵심이 무엇인가요? 어떤 상황에서 불편함을 느꼈는지 편하게 말씀해 주세요."
        placeholder="문제 정의에 대해 질문하세요..."
      />
    </div>
  );
}
