"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AiChat from "@/components/ai-assistant/AiChat";
import StepIndicator from "@/components/progress-tracker/StepIndicator";
import { Plus, Trash2, Save, ArrowRight, CheckCircle, Check, Download, Cpu, Wand2 } from "lucide-react";
import { getProject, updateProject, type Episode, type Cut, type Project } from "@/lib/storage";
import { downloadEpisode, downloadAllEpisodes } from "@/lib/download";

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

  useEffect(() => {
    const p = getProject(id);
    if (p) {
      setProject(p);
      updateProject(id, { currentStep: Math.max(4, p.currentStep) });
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

  const save = () => {
    setSaving(true);
    updateProject(id, {
      episodes,
      currentStep: Math.max(4, project?.currentStep ?? 1),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const goNext = () => {
    updateProject(id, {
      episodes,
      currentStep: Math.max(4, project?.currentStep ?? 1),
    });
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
        body: JSON.stringify({ ideaChat: project.ideaChat, step: "episodes" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (Array.isArray(data.episodes)) {
        setEpisodes((prev) =>
          data.episodes.map((ep: { title: string; synopsis: string }, i: number) => ({
            episodeNumber: i + 1,
            title: ep.title ?? "",
            synopsis: ep.synopsis ?? "",
            cuts: prev[i]?.cuts ?? [],
            script: prev[i]?.script ?? "",
            isCompleted: prev[i]?.isCompleted ?? false,
          }))
        );
        setActiveEp(0);
      }
    } catch {
      alert("자동채우기에 실패했어요. 다시 시도해주세요.");
    } finally {
      setAutofilling(false);
    }
  };

  const ep = episodes[activeEp];

  const selectClass =
    "flex h-9 w-full rounded-xl border border-[#EBE7E0] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C06070]/20 focus:border-[#C06070]/40 transition-all duration-200";

  return (
    <div className="min-h-screen bg-[#FBF9F6]">
      <header className="bg-white border-b border-[#EBE7E0] px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-[#ADA8A0] hover:text-[#7A7067] transition-colors flex-shrink-0"
            >
              <img src="/plancraft-logo.jpg" className="w-3.5 h-3.5 rounded object-cover" alt="" /> 대시보드
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
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-[#C06070]/30 text-[#C06070] hover:bg-[#C06070]/5 transition-all duration-200 disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" /> {autofilling ? "채우는 중..." : "AI 자동채우기"}
                </button>
                <button
                  onClick={() => downloadEpisode({ ...project, episodes }, activeEp)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5" /> 이 기능
                </button>
                <button
                  onClick={() => downloadAllEpisodes({ ...project, episodes })}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5" /> 전체
                </button>
              </>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full bg-[#C06070] text-white hover:bg-[#A8505F] transition-all duration-300 disabled:opacity-50"
            >
              {saved ? <><Check className="w-3.5 h-3.5" /> 저장됨</> : saving ? "저장 중..." : <><Save className="w-3.5 h-3.5" /> 저장</>}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-5">
        {/* Left sidebar */}
        <aside className="w-52 flex-shrink-0 space-y-3 sticky top-20 self-start">
          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <StepIndicator currentStep={project?.currentStep ?? 1} projectId={id} isCompleted={project?.isCompleted} />
          </div>

          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#1A1A1A]">기능 목록</span>
              <button onClick={addEpisode} className="text-[#C06070] hover:text-[#A8505F] transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {episodes.map((ep, i) => (
                <button
                  key={i}
                  onClick={() => setActiveEp(i)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all duration-200 ${
                    activeEp === i
                      ? "bg-[#C06070]/8 text-[#C06070] font-semibold border border-[#C06070]/20"
                      : "text-[#7A7067] hover:bg-[#F4F1EC]"
                  }`}
                >
                  <span>기능 {ep.episodeNumber} {ep.title && `· ${ep.title.slice(0, 6)}`}</span>
                  {ep.isCompleted && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-medium text-[#C06070] uppercase tracking-widest mb-1">Step 04</p>
              <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">기능 {ep?.episodeNumber} 설계</h1>
            </div>
            <label className="flex items-center gap-2 text-xs text-[#7A7067] cursor-pointer">
              <input
                type="checkbox"
                checked={ep?.isCompleted ?? false}
                onChange={(e) => updateEp("isCompleted", e.target.checked)}
                className="rounded accent-[#C06070]"
              />
              이 기능 완료됨
            </label>
          </div>

          {/* 제목 & 줄거리 */}
          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">기능 {ep?.episodeNumber} 이름 & 설명</label>
            <p className="text-[10px] text-[#ADA8A0] mb-3">이 기능이 무엇을 하는지 간략히 정리해봐요</p>
            <div className="space-y-3">
              <Input
                placeholder={`기능 ${ep?.episodeNumber} 이름 (예: 식단 추천, 잔반 분석)`}
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
                <Cpu className="w-4 h-4 text-[#C06070]" />
                <span className="text-sm font-bold text-[#1A1A1A]">처리 단계 구성</span>
              </div>
              <button
                onClick={addCut}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] hover:border-[#C06070]/30 transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5" /> 단계 추가
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-[10px] text-[#ADA8A0]">단계별로 처리 유형, 동작 설명, 입출력 데이터, 예외 처리를 설계해봐요</p>

              {(!ep?.cuts || ep.cuts.length === 0) ? (
                <div className="text-center py-12 bg-[#FBF9F6] rounded-xl border border-dashed border-[#EBE7E0]">
                  <Cpu className="w-8 h-8 text-[#D4CFC9] mx-auto mb-3" />
                  <p className="text-xs text-[#ADA8A0] mb-3">아직 단계가 없어요. 첫 번째 처리 단계를 추가해봐요!</p>
                  <button
                    onClick={addCut}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full bg-[#C06070] text-white hover:bg-[#A8505F] transition-all duration-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> 단계 추가
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {ep.cuts.map((cut, cutIdx) => (
                    <div key={cutIdx} className="border border-[#EBE7E0] rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FBF9F6] border-b border-[#EBE7E0]">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#C06070] w-10">단계 {cutIdx + 1}</span>
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
                          className="p-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-200"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#ADA8A0] hover:text-red-400" />
                        </button>
                      </div>

                      <div className="p-4 grid grid-cols-2 gap-3">
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
                            placeholder="예: 학생 ID, 메뉴 선택값"
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#7A7067] mb-1.5">출력/결과</label>
                          <Input
                            value={cut.soundEffect}
                            onChange={(e) => updateCut(cutIdx, "soundEffect", e.target.value)}
                            placeholder="예: 추천 식단 목록, 오류 메시지"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addCut}
                    className="w-full py-2.5 rounded-xl border border-dashed border-[#EBE7E0] text-xs text-[#ADA8A0] hover:border-[#C06070]/30 hover:text-[#C06070] hover:bg-[#FBF9F6] transition-all duration-200 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> 단계 추가
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="text-xs font-medium px-4 py-2.5 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200 disabled:opacity-50"
            >
              저장
            </button>
            <button onClick={goNext} className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-[#C06070] text-white hover:bg-[#A8505F] transition-all duration-300">
              다음: 기획서 작성 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </main>

        <aside className="w-72 flex-shrink-0 h-[calc(100vh-5rem)] sticky top-20">
          <AiChat
            step="panel"
            initialMessage="기능 설계를 도와드릴게요! 어떤 핵심 기능을 만들고 싶으신가요? 기능의 입력·처리·출력 흐름을 함께 정리해봐요."
            placeholder="기능 설계에 대해 질문하세요..."
          />
        </aside>
      </div>
    </div>
  );
}
