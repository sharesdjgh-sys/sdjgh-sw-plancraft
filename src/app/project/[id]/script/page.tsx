"use client";

import { AiAutofillButton } from "@/components/project-workspace/AiAutofill";
import ProjectWorkspace from "@/components/project-workspace/ProjectWorkspace";
import workspaceStyles from "@/components/project-workspace/workspace.module.css";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { type AiChatHandle } from "@/components/ai-assistant/AiChat";
import EmptyContentModal from "@/components/EmptyContentModal";
import { Save, Check, Download, FileText, CheckCircle } from "lucide-react";
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

  useEffect(() => {
    const p = getProject(id);
    if (p) {
      const updatedStep = Math.max(5, p.currentStep);
      updateProject(id, { currentStep: updatedStep });
      setProject({ ...p, currentStep: updatedStep });
      setProposalScript(p.proposalScript ?? "");
    }
  }, [id]);

  const userType = project?.userType ?? "student";
  const scriptInitialMessage =
    userType === "general"
      ? "기획서 작성을 도와드릴게요. 문제 정의, 해결 방식, 운영 계획, 기대 효과가 설득력 있게 연결되도록 함께 다듬어볼까요?"
      : "기획서 작성을 도와드릴게요! 배경 및 필요성, 해결 방안, 핵심 기능, 기대 효과 순서로 작성하면 논리적인 기획서가 완성돼요.";

  const save = async () => {
    setSaving(true);
    try {
      updateProject(id, {
        proposalScript,
        currentStep: Math.max(5, getProject(id)?.currentStep ?? 1),
      });
      await saveProjectToDir(id, getProject(id));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setSaved(false);
      alert(error instanceof Error ? error.message : "저장에 실패했어요.");
    } finally { setSaving(false); }
  };

  const goNext = async () => {
    if (!proposalScript.trim()) { setShowEmptyModal(true); return; }
    try {
      updateProject(id, {
        proposalScript,
        currentStep: Math.max(5, getProject(id)?.currentStep ?? 1),
      });
      await saveProjectToDir(id, getProject(id));
      router.push(`/project/${id}/submit`);
    } catch (error) { alert(error instanceof Error ? error.message : "저장에 실패했어요."); }
  };

  const goNextAnyway = async () => {
    setShowEmptyModal(false);
    try {
      updateProject(id, {
        proposalScript,
        currentStep: Math.max(5, getProject(id)?.currentStep ?? 1),
      });
      await saveProjectToDir(id, getProject(id));
      router.push(`/project/${id}/submit`);
    } catch (error) { alert(error instanceof Error ? error.message : "저장에 실패했어요."); }
  };

  const autofill = async () => {
    if (saving || autofilling) return;
    if (!project?.ideaChat || project.ideaChat.length === 0) {
      alert("먼저 아이디어 발굴 단계에서 AI와 대화해주세요!");
      return;
    }
    setAutofilling(true);
    try {
      const res = await fetch("/api/ai/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaChat: project.ideaChat,
          step: "script",
          existingContent: proposalScript.trim() ? { script: proposalScript } : undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.script) {
        // 기존 내용이 있으면 AI 보완 내용을 뒤에 이어 붙임
        setProposalScript((prev) =>
          prev.trim() ? prev + "\n\n" + data.script : data.script
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "자동채우기에 실패했어요. 다시 시도해주세요.";
      alert(msg);
    } finally {
      setAutofilling(false);
    }
  };

  const charCount = proposalScript.length;
  const lineCount = proposalScript ? proposalScript.split("\n").length : 0;

  return (
    <>
      {showEmptyModal && (
        <EmptyContentModal
          title="기획서 내용이 비어있어요"
          description="기획서를 작성해야 다음 단계로 넘어갈 수 있어요. AI 자동채우기로 초안을 먼저 생성하거나 AI 멘토에게 도움을 요청해봐요!"
          autofilling={autofilling}
          onAutofill={() => { setShowEmptyModal(false); autofill(); }}
          onAskMentor={() => { setShowEmptyModal(false); aiChatRef.current?.focusInput(); }}
          onGoAnyway={goNextAnyway}
          onClose={() => setShowEmptyModal(false)}
        />
      )}
      <ProjectWorkspace
        projectId={id}
        step={5}
        mentorStep="script"
        mentorRef={aiChatRef}
        mentorContext={{ proposalScript }}
        mentorMessage={scriptInitialMessage}
        mentorPlaceholder="기획서 작성에 대해 질문하세요..."
        onSave={save} busy={saving || autofilling} onNext={goNext} nextLabel="다음: 최종 검토"
        autofillMessage={autofilling ? "AI가 기획서 초안을 작성하고 있어요" : undefined}
        actions={<><AiAutofillButton onClick={autofill} loading={autofilling} disabled={saving} /><button disabled={!project} onClick={() => { if (project) downloadProposalScript({ ...project, proposalScript }); }}><Download size={14} />다운로드</button><button onClick={save} disabled={saving || autofilling} className={workspaceStyles.saveButton}>{saved ? <><Check size={14} /> 저장됨</> : saving ? "저장 중..." : <><Save size={14} /> 저장</>}</button></>}
      >
        <details className={workspaceStyles.references}><summary>지금까지 정리한 내용 확인 · 기능과 이해관계자</summary><div className={workspaceStyles.referenceGrid}><FeatureListPanel episodes={project?.episodes ?? []} /><CharacterPanel characters={project?.characters ?? []} /></div></details>
{/* 기획서 내용 */}
          <div className="bg-white rounded-2xl border border-[#EBE7E0] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#EBE7E0]">
              <FileText className="w-4 h-4 text-[#D4547A]" />
              <span className="text-sm font-bold text-[#1A1A1A]">기획서 내용</span>
            </div>
            <div className="p-5">
              <p className="text-[10px] text-[#ADA8A0] mb-3">
                지금까지 정리한 내용을 바탕으로 완성된 기획서를 작성해봐요. 위의 참고 내용을 펼쳐 기능과 이해관계자를 확인하세요.
              </p>
              <Textarea
                placeholder={userType === "general"
                  ? `기획서를 작성해주세요.\n\n예시:\n[배경 및 필요성]\n모임 일정과 신청 정보가 여러 채널에 흩어져 참여자가 중요한 안내를 놓칩니다.\n\n[해결 방안]\n일정과 신청 현황을 한곳에 모아 참여자와 운영자가 함께 확인하는 서비스를 만듭니다.\n\n[핵심 기능]\n1. 일정 모아보기 — 날짜별 일정과 신청 기한 표시\n2. 신청 관리 — 참여 신청과 현재 상태 확인\n\n[기대 효과]\n안내를 찾는 수고와 신청 기한 누락을 줄이고자 합니다.`
                  : `기획서를 작성해주세요.\n\n예시:\n[배경 및 필요성]\n매년 학교 급식에서 발생하는 잔반량은 전국적으로 ...\n\n[해결 방안]\n본 SW는 학생 식단 선호 데이터를 수집하여 ...\n\n[핵심 기능]\n1. 식단 추천 — 학생 선호도 기반 개인화 추천\n2. 잔반 분석 — 섭취량 추적 및 통계 제공\n\n[기대 효과]\n잔반량 30% 감소, 급식 만족도 향상 ...`}
                value={proposalScript}
                onChange={(e) => setProposalScript(e.target.value)}
                rows={18}
                className="text-sm"
              />
              <div className="flex justify-end mt-2 gap-3 text-[10px] text-[#ADA8A0]">
                <span>{lineCount}줄</span>
                <span>{charCount.toLocaleString()}자</span>
              </div>
            </div>
          </div>
      </ProjectWorkspace>
    </>
  );
}
