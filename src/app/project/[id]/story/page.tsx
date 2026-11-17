"use client";

import ProjectWorkspace from "@/components/project-workspace/ProjectWorkspace";
import workspaceStyles from "@/components/project-workspace/workspace.module.css";

import { useState, useEffect, use, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { type AiChatHandle } from "@/components/ai-assistant/AiChat";
import EmptyContentModal from "@/components/EmptyContentModal";
import { useRouter } from "next/navigation";
import { Save, Check, Download, Wand2 } from "lucide-react";
import { getProject, updateProject, type Project } from "@/lib/storage";
import { downloadStory } from "@/lib/download";
import { saveProjectToDir } from "@/lib/fileStorage";

function mergeText(existing: string, aiContent: string | null | undefined): string {
  if (!aiContent) return existing;
  if (!existing.trim()) return aiContent;
  return existing + "\n\n" + aiContent;
}

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

  useEffect(() => {
    const p = getProject(id);
    if (p) { setProject(p); setStory(p.story); }
  }, [id]);

  const userType = project?.userType ?? "student";
  const storyInitialMessage =
    userType === "general"
      ? "문제 정의를 도와드릴게요. 해결하려는 현장 문제의 핵심, 발생 배경, 왜 지금 중요한지를 함께 정리해볼까요?"
      : "문제 정의를 도와드릴게요! 해결하려는 문제의 핵심이 무엇인가요? 어떤 상황에서 불편함을 느꼈는지 편하게 말씀해 주세요.";

  const save = async () => {
    setSaving(true);
    updateProject(id, {
      story: { ...story },
      currentStep: Math.max(2, getProject(id)?.currentStep ?? 1),
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
      currentStep: Math.max(2, getProject(id)?.currentStep ?? 1),
    });
    await saveProjectToDir(id, getProject(id));
    router.push(`/project/${id}/characters`);
  };

  const goNextAnyway = async () => {
    setShowEmptyModal(false);
    updateProject(id, {
      story: { ...story },
      currentStep: Math.max(2, getProject(id)?.currentStep ?? 1),
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
        body: JSON.stringify({ ideaChat: project.ideaChat, step: "story", existingContent: story }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStory((s) => ({
        // logline: 한 문장이므로 비어있을 때만 채움
        logline: s.logline.trim() ? s.logline : (data.logline ?? s.logline),
        // 긴 텍스트 필드: 비어있으면 채우고, 있으면 AI 보완 내용을 이어 붙임
        theme: mergeText(s.theme, data.theme),
        setting: mergeText(s.setting, data.setting),
        plotOutline: mergeText(s.plotOutline, data.plotOutline),
        // totalEpisodes: 기본값(1)이 아닌 경우 사용자 값 유지
        totalEpisodes: s.totalEpisodes !== "1" ? s.totalEpisodes : (data.totalEpisodes ?? s.totalEpisodes),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "자동채우기에 실패했어요. 다시 시도해주세요.";
      alert(msg);
    } finally {
      setAutofilling(false);
    }
  };

  return (
    <>
      {showEmptyModal && (
        <EmptyContentModal
          title="문제 정의 내용이 비어있어요"
          description="아이디어 한 줄 소개, 해결하려는 문제 등 주요 내용을 하나 이상 작성해야 다음 단계로 넘어갈 수 있어요. 어려우면 AI 도움을 받아봐요!"
          autofilling={autofilling}
          onAutofill={() => { setShowEmptyModal(false); autofill(); }}
          onAskMentor={() => { setShowEmptyModal(false); aiChatRef.current?.focusInput(); }}
          onGoAnyway={goNextAnyway}
          onClose={() => setShowEmptyModal(false)}
        />
      )}
      <ProjectWorkspace
        projectId={id}
        step={2}
        mentorStep="story"
        mentorRef={aiChatRef}
        mentorContext={{ story }}
        mentorMessage={storyInitialMessage}
        mentorPlaceholder="문제 정의에 대해 질문하세요..."
        onSave={save} busy={saving || autofilling} onNext={goNext} nextLabel="다음: 이해관계자 분석"
        actions={<><button onClick={autofill} disabled={autofilling}><Wand2 size={14} />{autofilling ? "채우는 중..." : "AI 자동채우기"}</button><button disabled={!project} onClick={() => { if (project) downloadStory({ ...project, story }); }}><Download size={14} />다운로드</button><button onClick={save} disabled={saving} className={workspaceStyles.saveButton}>{saved ? <><Check size={14} /> 저장됨</> : saving ? "저장 중..." : <><Save size={14} /> 저장</>}</button></>}
      >
        <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">아이디어 한 줄 소개</label>
            <p className="text-[10px] text-[#ADA8A0] mb-3">
              {userType === "general"
                ? "서비스를 사용할 학생들이 들었을 때 바로 이해할 수 있는 한 문장"
                : "심사위원이 읽었을 때 SW가 궁금해지는 한 문장"}
            </p>
            <Input
              placeholder={userType === "general"
                ? "예: 수업 중 학생 이해도를 실시간으로 파악하는 교사용 피드백 앱"
                : "예: 급식 잔반 데이터를 분석해 학교 식단을 개선하는 AI 추천 시스템"}
              value={story.logline}
              onChange={(e) => setStory((s) => ({ ...s, logline: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">해결하려는 문제</label>
              <p className="text-[10px] text-[#ADA8A0] mb-3">왜 이 문제가 중요한지, 현재 어떤 불편함이 있는지</p>
              <Textarea
                placeholder={userType === "general"
                  ? "교육 현장에서 어떤 불편함을 겪고 계신가요? 학생 지도·수업·행정 중 개선하고 싶은 상황을 구체적으로 써주세요."
                  : "어떤 사회적 문제 또는 불편함을 해결하려 하나요? 현재 상황과 문제의 심각성을 구체적으로 써봐요."}
                value={story.theme}
                onChange={(e) => setStory((s) => ({ ...s, theme: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">배경 및 필요성</label>
              <p className="text-[10px] text-[#ADA8A0] mb-3">문제가 발생하는 환경, 관련 통계나 사례</p>
              <Textarea
                placeholder={userType === "general"
                  ? "이 문제가 발생하는 교육 환경과, 이 서비스가 왜 필요한지 설명해주세요."
                  : "문제가 발생하는 배경과 이 SW가 왜 필요한지 설명해주세요."}
                value={story.setting}
                onChange={(e) => setStory((s) => ({ ...s, setting: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">기능 개요</label>
            <p className="text-[10px] text-[#ADA8A0] mb-3">SW가 어떻게 문제를 해결하는지 전체적인 흐름을 정리해보세요</p>
            <Textarea
              placeholder={`문제 인식: 어떤 상황에서 SW가 필요한가\n해결 방식: SW가 어떻게 작동하는가\n주요 기능: 핵심 기능 목록\n기대 효과: 사용 후 어떤 변화가 생기는가`}
              value={story.plotOutline}
              onChange={(e) => setStory((s) => ({ ...s, plotOutline: e.target.value }))}
              rows={6}
            />
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#EBE7E0]">
              <label className="text-xs font-semibold text-[#1A1A1A] whitespace-nowrap">핵심 기능 수</label>
              <Input type="number" min="1" max="20" value={story.totalEpisodes} onChange={(e) => setStory((s) => ({ ...s, totalEpisodes: e.target.value }))} className="w-20" />
              <span className="text-xs text-[#ADA8A0]">개</span>
            </div>
          </div>
      </ProjectWorkspace>
    </>
  );
}
