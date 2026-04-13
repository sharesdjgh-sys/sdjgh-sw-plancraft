"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import AiChat from "@/components/ai-assistant/AiChat";
import StepIndicator from "@/components/progress-tracker/StepIndicator";
import { Save, ArrowRight, ArrowLeft, CheckCircle, Sparkles, Check, Download, FileText, Plus, ChevronDown, ChevronUp, Users } from "lucide-react";
import { getProject, updateProject, type Episode, type Cut, type Project, type Character } from "@/lib/storage";
import { downloadEpisode, downloadAllEpisodes } from "@/lib/download";

function CharacterPanel({ characters }: { characters: Character[] }) {
  const [open, setOpen] = useState(true);
  if (characters.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-[#EBE7E0] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden mb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F1EC] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#C06070]" />
          <span className="text-xs font-bold text-[#1A1A1A]">등장인물</span>
          <span className="text-[10px] text-[#ADA8A0]">{characters.length}명</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-[#ADA8A0]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#ADA8A0]" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {characters.map((ch, i) => (
            <div key={i} className="flex items-start gap-2 px-2.5 py-2 rounded-xl bg-[#FBF9F6] border border-[#EBE7E0]">
              <div className="w-5 h-5 rounded-full bg-[#C06070]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[8px] font-bold text-[#C06070]">{(ch.name || "?")[0]}</span>
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
  const [project, setProject] = useState<Project | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([
    { episodeNumber: 1, title: "", synopsis: "", cuts: [], script: "", isCompleted: false },
  ]);
  const [activeEp, setActiveEp] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProject(id);
    if (p) {
      setProject(p);
      if (p.episodes.length > 0) {
        setEpisodes(p.episodes.map((ep) => ({ ...ep, cuts: ep.cuts ?? [] })));
      }
    }
  }, [id]);

  const updateEp = (field: keyof Episode, value: string | boolean | Cut[]) => {
    setEpisodes((eps) => eps.map((ep, i) => (i === activeEp ? { ...ep, [field]: value } : ep)));
  };

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

  const save = () => {
    setSaving(true);
    updateProject(id, {
      episodes,
      currentStep: Math.max(5, project?.currentStep ?? 1),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ep = episodes[activeEp];
  const scriptText = ep?.script ?? "";
  const charCount = scriptText.length;
  const lineCount = scriptText ? scriptText.split("\n").length : 0;

  return (
    <div className="min-h-screen bg-[#FBF9F6]">
      <header className="bg-white border-b border-[#EBE7E0] px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-[#ADA8A0] hover:text-[#7A7067] transition-colors flex-shrink-0"
            >
              <Sparkles className="w-3 h-3 text-[#C06070]" /> 대시보드
            </Link>
            <span className="text-[#EBE7E0]">/</span>
            <span className="text-xs font-semibold text-[#1A1A1A] truncate">{project?.title ?? "..."}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {project && (
              <>
                <button
                  onClick={() => downloadEpisode({ ...project, episodes }, activeEp)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5" /> 이 화
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
            <StepIndicator currentStep={project?.currentStep ?? 1} projectId={id} />
          </div>

          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#1A1A1A]">화 목록</span>
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
                  <span>{ep.episodeNumber}화 {ep.title && `· ${ep.title.slice(0, 6)}`}</span>
                  {ep.isCompleted && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-medium text-[#C06070] uppercase tracking-widest mb-1">Step 05</p>
              <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">{ep?.episodeNumber}화 대본 작성</h1>
            </div>
            <label className="flex items-center gap-2 text-xs text-[#7A7067] cursor-pointer">
              <input
                type="checkbox"
                checked={ep?.isCompleted ?? false}
                onChange={(e) => updateEp("isCompleted", e.target.checked)}
                className="rounded accent-[#C06070]"
              />
              이 화 완료됨
            </label>
          </div>

          {/* 화 정보 */}
          {ep?.title && (
            <div className="bg-[#F4F1EC] rounded-2xl border border-[#EBE7E0] px-5 py-3 flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#C06070] flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">{ep.episodeNumber}화: {ep.title}</p>
                {ep.synopsis && <p className="text-[10px] text-[#7A7067] mt-0.5 line-clamp-1">{ep.synopsis}</p>}
              </div>
              <Link
                href={`/project/${id}/episodes`}
                className="ml-auto text-[10px] text-[#ADA8A0] hover:text-[#C06070] transition-colors whitespace-nowrap"
              >
                콘티 보기 →
              </Link>
            </div>
          )}

          {/* 대본 */}
          <div className="bg-white rounded-2xl border border-[#EBE7E0] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#EBE7E0]">
              <FileText className="w-4 h-4 text-[#C06070]" />
              <span className="text-sm font-bold text-[#1A1A1A]">대본</span>
            </div>
            <div className="p-5">
              <p className="text-[10px] text-[#ADA8A0] mb-3">장면 묘사, 대사, 효과음을 자유롭게 써봐요</p>
              <Textarea
                placeholder={`대본을 작성해주세요.\n\n예시:\n[장면1: 학교 복도, 낮]\n(주인공이 급하게 달려온다)\n주인공: "늦었어! 어떡해!"\n친구: (손을 흔들며) "여기야!"`}
                value={scriptText}
                onChange={(e) => updateEp("script", e.target.value)}
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
                <ArrowLeft className="w-3.5 h-3.5" /> 이전: 콘티 제작
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
              <Link href={`/project/${id}/submit`}>
                <button className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-[#C06070] text-white hover:bg-[#A8505F] transition-all duration-300">
                  다음: 제출 준비 <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </main>

        <aside className="w-72 flex-shrink-0 sticky top-20 flex flex-col gap-3" style={{ height: "calc(100vh - 5rem)" }}>
          <CharacterPanel characters={project?.characters ?? []} />
          <div className="flex-1 min-h-0">
            <AiChat
              step="script"
              initialMessage="대본 작업을 도와드릴게요! 대사나 장면 묘사에 대해 도움이 필요하시면 말씀해 주세요!"
              placeholder="대본·대사에 대해 질문하세요..."
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
