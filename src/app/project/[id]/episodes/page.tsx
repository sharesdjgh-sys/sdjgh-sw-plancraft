"use client";

import ProjectWorkspace from "@/components/project-workspace/ProjectWorkspace";
import workspaceStyles from "@/components/project-workspace/workspace.module.css";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type AiChatHandle } from "@/components/ai-assistant/AiChat";
import EmptyContentModal from "@/components/EmptyContentModal";
import { Plus, Trash2, Save, CheckCircle, Check, Download, Cpu, Wand2, GripVertical } from "lucide-react";
import { getProject, updateProject, type Episode, type Cut, type Project } from "@/lib/storage";
import { downloadEpisode, downloadAllEpisodes } from "@/lib/download";
import { saveProjectToDir } from "@/lib/fileStorage";

const ANGLES = ["사용자 입력", "시스템 처리", "데이터 조회", "결과 출력", "알림 발송", "조건 분기", "오류 처리"];

export default function EpisodesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([
    { episodeNumber: 1, title: "", synopsis: "", cuts: [], script: "", isCompleted: false },
  ]);
  const [activeEp, setActiveEp] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const aiChatRef = useRef<AiChatHandle>(null);
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const p = getProject(id);
    if (p) {
      const updatedStep = Math.max(4, p.currentStep);
      updateProject(id, { currentStep: updatedStep });
      setProject({ ...p, currentStep: updatedStep });
      const totalEp = Math.max(1, parseInt(p.story.totalEpisodes) || 1);
      const existing = p.episodes.length > 0
        ? p.episodes.map((ep) => ({ ...ep, cuts: ep.cuts ?? [] }))
        : [{ episodeNumber: 1, title: "", synopsis: "", cuts: [], script: "", isCompleted: false }];

      if (totalEp > existing.length) {
        const stubs: Episode[] = Array.from({ length: totalEp - existing.length }, (_, i) => ({
          episodeNumber: existing.length + i + 1,
          title: "",
          synopsis: "",
          cuts: [],
          script: "",
          isCompleted: false,
        }));
        const merged = [...existing, ...stubs];
        setEpisodes(merged);
        updateProject(id, { episodes: merged });
      } else {
        setEpisodes(existing);
      }
    }
  }, [id]);

  const userType = project?.userType ?? "student";
  const panelInitialMessage =
    userType === "general"
      ? "기능 설계를 도와드릴게요. 핵심 기능 우선순위와 입력·처리·출력 흐름을 실제 운영 가능한 형태로 함께 정리해볼까요?"
      : "기능 설계를 도와드릴게요! 어떤 핵심 기능을 만들고 싶으신가요? 기능의 입력·처리·출력 흐름을 함께 정리해봐요.";

  const addEpisode = () => {
    const newEp: Episode = {
      episodeNumber: episodes.length + 1,
      title: "",
      synopsis: "",
      cuts: [],
      script: "",
      isCompleted: false,
    };
    setEpisodes((e) => [...e, newEp]);
    setActiveEp(episodes.length);
  };

  const updateEp = (field: keyof Episode, value: string | boolean | Cut[]) => {
    setEpisodes((eps) => eps.map((ep, i) => (i === activeEp ? { ...ep, [field]: value } : ep)));
  };

  const addCut = () => {
    const newCut: Cut = { angle: "사용자 입력", description: "", dialogue: "", soundEffect: "" };
    const updated = [...(episodes[activeEp]?.cuts ?? []), newCut];
    updateEp("cuts", updated);
  };

  const updateCut = (cutIdx: number, field: keyof Cut, value: string) => {
    const updated = (episodes[activeEp]?.cuts ?? []).map((c, i) =>
      i === cutIdx ? { ...c, [field]: value } : c
    );
    updateEp("cuts", updated);
  };

  const removeCut = (cutIdx: number) => {
    const updated = (episodes[activeEp]?.cuts ?? []).filter((_, i) => i !== cutIdx);
    updateEp("cuts", updated);
  };

  const handleDragStart = (idx: number) => {
    dragIndexRef.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const fromIdx = dragIndexRef.current;
    if (fromIdx === null || fromIdx === toIdx) return;
    dragIndexRef.current = null;
    const cuts = [...(episodes[activeEp]?.cuts ?? [])];
    const [moved] = cuts.splice(fromIdx, 1);
    cuts.splice(toIdx, 0, moved);
    updateEp("cuts", cuts);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const save = async () => {
    setSaving(true);
    updateProject(id, {
      episodes,
      currentStep: Math.max(4, getProject(id)?.currentStep ?? 1),
    });
    await saveProjectToDir(id, getProject(id));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const goNext = async () => {
    if (episodes.every((ep) => !ep.title.trim())) { setShowEmptyModal(true); return; }
    updateProject(id, {
      episodes,
      currentStep: Math.max(4, getProject(id)?.currentStep ?? 1),
    });
    await saveProjectToDir(id, getProject(id));
    router.push(`/project/${id}/script`);
  };

  const goNextAnyway = async () => {
    setShowEmptyModal(false);
    updateProject(id, {
      episodes,
      currentStep: Math.max(4, getProject(id)?.currentStep ?? 1),
    });
    await saveProjectToDir(id, getProject(id));
    router.push(`/project/${id}/script`);
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
        body: JSON.stringify({
          ideaChat: project.ideaChat,
          step: "episodes",
          existingContent: {
            episodes: episodes.map((ep) => ({ title: ep.title, synopsis: ep.synopsis })),
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (Array.isArray(data.episodes)) {
        setEpisodes((prev) => {
          const maxLen = Math.max(prev.length, data.episodes.length);
          return Array.from({ length: maxLen }, (_, i) => {
            const existing = prev[i];
            const aiEp = data.episodes[i] as { title: string | null; synopsis: string | null } | undefined;
            if (!existing) {
              // AI가 추가 제안한 새 기능 슬롯
              return {
                episodeNumber: i + 1,
                title: aiEp?.title ?? "",
                synopsis: aiEp?.synopsis ?? "",
                cuts: [],
                script: "",
                isCompleted: false,
              };
            }
            return {
              ...existing,
              // 기존 내용이 있으면 유지, 비어있으면 AI 내용으로 채움
              title: existing.title.trim() ? existing.title : (aiEp?.title ?? existing.title),
              synopsis: existing.synopsis.trim() ? existing.synopsis : (aiEp?.synopsis ?? existing.synopsis),
            };
          });
        });
        setActiveEp(0);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "자동채우기에 실패했어요. 다시 시도해주세요.";
      alert(msg);
    } finally {
      setAutofilling(false);
    }
  };

  const [autofillingCuts, setAutofillingCuts] = useState(false);

  const autofillCuts = async () => {
    const currentEp = episodes[activeEp];
    if (!project?.ideaChat || project.ideaChat.length === 0) {
      alert("먼저 아이디어 발굴 단계에서 AI와 대화해주세요!");
      return;
    }
    setAutofillingCuts(true);
    try {
      const res = await fetch("/api/ai/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaChat: project.ideaChat,
          step: "cuts",
          existingContent: {
            episodeTitle: currentEp?.title || "기능",
            episodeSynopsis: currentEp?.synopsis || "",
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (Array.isArray(data.cuts) && data.cuts.length > 0) {
        updateEp("cuts", data.cuts);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "처리 단계 자동채우기에 실패했어요. 다시 시도해주세요.";
      alert(msg);
    } finally {
      setAutofillingCuts(false);
    }
  };

  const ep = episodes[activeEp];

  const selectClass =
    "flex h-9 w-full rounded-xl border border-[#EBE7E0] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#D4547A]/20 focus:border-[#D4547A]/40 transition-all duration-200";

  return (
    <>
      {showEmptyModal && (
        <EmptyContentModal
          title="기능 이름이 비어있어요"
          description="핵심 기능의 이름을 하나 이상 작성해야 다음 단계로 넘어갈 수 있어요. 어려우면 AI 도움을 받아봐요!"
          autofilling={autofilling}
          onAutofill={() => { setShowEmptyModal(false); autofill(); }}
          onAskMentor={() => { setShowEmptyModal(false); aiChatRef.current?.focusInput(); }}
          onGoAnyway={goNextAnyway}
          onClose={() => setShowEmptyModal(false)}
        />
      )}
      <ProjectWorkspace
        projectId={id}
        step={4}
        mentorStep="panel"
        mentorRef={aiChatRef}
        mentorContext={{ episodes }}
        mentorMessage={panelInitialMessage}
        mentorPlaceholder="기능 설계에 대해 질문하세요..."
        onSave={save} busy={saving || autofilling || autofillingCuts} onNext={goNext} nextLabel="다음: 기획서 작성"
        actions={<><button onClick={autofill} disabled={autofilling}><Wand2 size={14} />{autofilling ? "채우는 중..." : "AI 자동채우기"}</button><button disabled={!project} onClick={() => { if (project) downloadEpisode({ ...project, episodes }, activeEp); }}><Download size={14} />이 기능 다운로드</button><button disabled={!project} onClick={() => { if (project) downloadAllEpisodes({ ...project, episodes }); }}><Download size={14} />전체 다운로드</button><button onClick={save} disabled={saving} className={workspaceStyles.saveButton}>{saved ? <><Check size={14} /> 저장됨</> : saving ? "저장 중..." : <><Save size={14} /> 저장</>}</button></>}
      >
        {/* 모바일 기능 탭 */}
          <div className={workspaceStyles.featureTabs}>
            {episodes.map((ep, i) => (
              <button
                key={i}
                onClick={() => setActiveEp(i)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  activeEp === i
                    ? "bg-[#D4547A] text-white border-[#D4547A]"
                    : "bg-white text-[#7A7067] border-[#EBE7E0]"
                }`}
              >
                기능 {ep.episodeNumber}{ep.title ? ` · ${ep.title}` : ""}
                {ep.isCompleted && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
              </button>
            ))}
            <button
              onClick={addEpisode}
              className="flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-dashed border-[#EBE7E0] text-[#ADA8A0]"
            >
              <Plus className="w-3 h-3" /> 추가
            </button>
          </div>

          <div className={workspaceStyles.featureHeading}><h2>기능 {ep?.episodeNumber} 세부 설계</h2><label className="flex items-center gap-2 text-xs text-[#7A7067] cursor-pointer">
              <input
                type="checkbox"
                checked={ep?.isCompleted ?? false}
                onChange={(e) => updateEp("isCompleted", e.target.checked)}
                className="rounded accent-[#D4547A]"
              />
              이 기능 완료됨
            </label></div>
{/* 제목 & 설명 */}
          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">기능 {ep?.episodeNumber} 이름 & 설명</label>
            <p className="text-[10px] text-[#ADA8A0] mb-3">이 기능이 무엇을 하는지 간략히 정리해봐요</p>
            <div className="space-y-3">
              <Input
                placeholder={userType === "general"
                  ? `기능 ${ep?.episodeNumber} 이름 (예: 출석 체크, 알림 발송, 학습 현황 조회)`
                  : `기능 ${ep?.episodeNumber} 이름 (예: 식단 추천, 잔반 분석)`}
                value={ep?.title ?? ""}
                onChange={(e) => updateEp("title", e.target.value)}
              />
              <Textarea
                placeholder={`기능 ${ep?.episodeNumber}이 어떻게 동작하는지 간략히 설명해주세요`}
                value={ep?.synopsis ?? ""}
                onChange={(e) => updateEp("synopsis", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* 콘티 */}
          <div className="bg-white rounded-2xl border border-[#EBE7E0] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBE7E0]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#D4547A]" />
                <span className="text-sm font-bold text-[#1A1A1A]">처리 단계 구성</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={autofillCuts}
                  disabled={autofillingCuts}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-[#D4547A]/30 text-[#D4547A] hover:bg-[#D4547A]/5 transition-all duration-200 disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {autofillingCuts ? "채우는 중..." : "AI 채우기"}
                </button>
                <button
                  onClick={addCut}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] hover:border-[#D4547A]/30 transition-all duration-200"
                >
                  <Plus className="w-3.5 h-3.5" /> 단계 추가
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-[10px] text-[#ADA8A0]">단계별로 처리 유형, 동작 설명, 입출력 데이터, 예외 처리를 설계해봐요</p>

              {(!ep?.cuts || ep.cuts.length === 0) ? (
                <div className="text-center py-12 bg-[#FBF9F6] rounded-xl border border-dashed border-[#EBE7E0]">
                  <Cpu className="w-8 h-8 text-[#D4CFC9] mx-auto mb-3" />
                  <p className="text-xs text-[#ADA8A0] mb-3">아직 단계가 없어요. AI 도움을 받거나 직접 추가해봐요!</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={autofillCuts}
                      disabled={autofillingCuts}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full border border-[#D4547A]/30 text-[#D4547A] hover:bg-[#D4547A]/5 transition-all duration-200 disabled:opacity-50"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      {autofillingCuts ? "채우는 중..." : "AI로 채우기"}
                    </button>
                    <button
                      onClick={addCut}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full bg-[#D4547A] text-white hover:bg-[#B8405F] transition-all duration-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> 직접 추가
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {ep.cuts.map((cut, cutIdx) => (
                    <div
                      key={cutIdx}
                      draggable
                      onDragStart={() => handleDragStart(cutIdx)}
                      onDragOver={(e) => handleDragOver(e, cutIdx)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, cutIdx)}
                      onDragEnd={handleDragEnd}
                      className={`border rounded-xl overflow-hidden transition-all duration-150 ${
                        dragOverIndex === cutIdx && dragIndexRef.current !== cutIdx
                          ? "border-[#D4547A] shadow-md scale-[1.01]"
                          : "border-[#EBE7E0]"
                      }`}
                    >
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FBF9F6] border-b border-[#EBE7E0]">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-[#C8C3BC] cursor-grab active:cursor-grabbing shrink-0" />
                          <span className="text-xs font-bold text-[#D4547A] whitespace-nowrap">단계 {cutIdx + 1}</span>
                          <select
                            value={cut.angle}
                            onChange={(e) => updateCut(cutIdx, "angle", e.target.value)}
                            className={selectClass + " w-36"}
                          >
                            {ANGLES.map((a) => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                        <button
                          onClick={() => removeCut(cutIdx)}
                          aria-label={"처리 단계 " + (cutIdx + 1) + " 삭제"}
                          className="p-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-200"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#ADA8A0] hover:text-red-400" />
                        </button>
                      </div>

                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-semibold text-[#7A7067] mb-1.5">동작 설명</label>
                          <Textarea
                            value={cut.description}
                            onChange={(e) => updateCut(cutIdx, "description", e.target.value)}
                            placeholder="이 단계에서 시스템이 어떤 동작을 수행하는지 구체적으로 써봐요"
                            rows={2}
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#7A7067] mb-1.5">입력 데이터</label>
                          <Input
                            value={cut.dialogue}
                            onChange={(e) => updateCut(cutIdx, "dialogue", e.target.value)}
                            placeholder={userType === "general" ? "예: 교사 ID, 학급 코드" : "예: 학생 ID, 메뉴 선택값"}
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#7A7067] mb-1.5">출력/결과</label>
                          <Input
                            value={cut.soundEffect}
                            onChange={(e) => updateCut(cutIdx, "soundEffect", e.target.value)}
                            placeholder={userType === "general" ? "예: 출석 현황 목록, 알림 발송 완료" : "예: 추천 식단 목록, 오류 메시지"}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addCut}
                    className="w-full py-2.5 rounded-xl border border-dashed border-[#EBE7E0] text-xs text-[#ADA8A0] hover:border-[#D4547A]/30 hover:text-[#D4547A] hover:bg-[#FBF9F6] transition-all duration-200 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> 단계 추가
                  </button>
                </div>
              )}
            </div>
          </div>
      </ProjectWorkspace>
    </>
  );
}
