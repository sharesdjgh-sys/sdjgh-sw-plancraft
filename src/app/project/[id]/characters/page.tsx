"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AiChat from "@/components/ai-assistant/AiChat";
import StepIndicator from "@/components/progress-tracker/StepIndicator";
import { Plus, Trash2, ArrowRight, Check, Save, User, Download, Wand2 } from "lucide-react";
import { getProject, updateProject, type Character, type Project } from "@/lib/storage";
import { downloadCharacters } from "@/lib/download";

const ROLES = ["주요 사용자", "보조 사용자", "운영자", "이해관계자", "기타"];

export default function CharactersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autofilling, setAutofilling] = useState(false);

  useEffect(() => {
    const p = getProject(id);
    if (p) {
      setProject(p);
      updateProject(id, { currentStep: Math.max(3, p.currentStep) });
      if (p.characters.length > 0) setCharacters(p.characters);
    }
  }, [id]);

  const addCharacter = () => {
    const newChar: Character = { name: "", role: "주요 사용자", age: "", appearance: "", personality: "", backstory: "" };
    setCharacters((c) => [...c, newChar]);
    setEditIdx(characters.length);
  };

  const updateChar = (idx: number, field: keyof Character, value: string) => {
    setCharacters((c) => c.map((ch, i) => (i === idx ? { ...ch, [field]: value } : ch)));
  };

  const removeChar = (idx: number) => {
    setCharacters((c) => c.filter((_, i) => i !== idx));
    if (editIdx === idx) setEditIdx(null);
  };

  const save = () => {
    setSaving(true);
    updateProject(id, {
      characters,
      currentStep: Math.max(3, project?.currentStep ?? 1),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const goNext = () => {
    updateProject(id, {
      characters,
      currentStep: Math.max(3, project?.currentStep ?? 1),
    });
    router.push(`/project/${id}/episodes`);
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
        body: JSON.stringify({ ideaChat: project.ideaChat, step: "character" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (Array.isArray(data.characters)) {
        setCharacters(data.characters);
        setEditIdx(null);
      }
    } catch {
      alert("자동채우기에 실패했어요. 다시 시도해주세요.");
    } finally {
      setAutofilling(false);
    }
  };

  const selectClass =
    "flex h-10 w-full rounded-xl border border-[#EBE7E0] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C06070]/20 focus:border-[#C06070]/40 transition-all duration-200";

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
                  onClick={() => downloadCharacters({ ...project, characters })}
                  className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5" /> 다운로드
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
        <aside className="w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-4 sticky top-20 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <StepIndicator currentStep={project?.currentStep ?? 1} projectId={id} isCompleted={project?.isCompleted} />
          </div>
        </aside>

        <main className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-medium text-[#C06070] uppercase tracking-widest mb-1">Step 03</p>
              <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">이해관계자 분석</h1>
            </div>
            <button
              onClick={addCharacter}
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] hover:border-[#C06070]/30 transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" /> 이해관계자 추가
            </button>
          </div>

          {characters.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-[#EBE7E0]">
              <div className="w-12 h-12 rounded-2xl bg-[#F4F1EC] flex items-center justify-center mx-auto mb-4">
                <User className="w-5 h-5 text-[#ADA8A0]" />
              </div>
              <p className="text-sm font-semibold text-[#1A1A1A] mb-1">아직 이해관계자가 없어요</p>
              <p className="text-xs text-[#7A7067] mb-5">첫 번째 이해관계자를 추가해봐요!</p>
              <button
                onClick={addCharacter}
                className="inline-flex items-center gap-2 bg-[#C06070] text-white text-xs font-medium px-5 py-2.5 rounded-full hover:bg-[#A8505F] transition-all duration-300"
              >
                <Plus className="w-3.5 h-3.5" /> 이해관계자 추가하기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {characters.map((ch, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${
                    editIdx === idx ? "border-[#C06070]/30" : "border-[#EBE7E0]"
                  }`}
                >
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {ch.role === "주요 사용자" ? "🙋" : ch.role === "운영자" ? "⚙️" : "👤"}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-[#1A1A1A]">{ch.name || "이름 없음"}</p>
                        <p className="text-xs text-[#ADA8A0]">{ch.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditIdx(editIdx === idx ? null : idx)}
                        className="text-xs text-[#7A7067] hover:text-[#1A1A1A] px-3 py-1.5 rounded-lg border border-[#EBE7E0] hover:bg-[#F4F1EC] transition-all duration-200"
                      >
                        {editIdx === idx ? "접기" : "편집"}
                      </button>
                      <button
                        onClick={() => removeChar(idx)}
                        className="p-1.5 rounded-lg border border-[#EBE7E0] hover:bg-red-50 hover:border-red-200 transition-all duration-200"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#ADA8A0] hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {editIdx === idx && (
                    <div className="px-5 pb-5 space-y-3 border-t border-[#EBE7E0] pt-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">대상 이름 *</label>
                          <Input
                            value={ch.name}
                            onChange={(e) => updateChar(idx, "name", e.target.value)}
                            placeholder="예: 고등학생, 학교 선생님"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">역할</label>
                          <select
                            value={ch.role}
                            onChange={(e) => updateChar(idx, "role", e.target.value)}
                            className={selectClass}
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">연령/특성</label>
                          <Input
                            value={ch.age}
                            onChange={(e) => updateChar(idx, "age", e.target.value)}
                            placeholder="예: 15~17세, 고등학생"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">현재 불편함</label>
                        <Textarea
                          value={ch.appearance}
                          onChange={(e) => updateChar(idx, "appearance", e.target.value)}
                          placeholder="이 대상이 현재 겪고 있는 불편함이나 문제점을 구체적으로 써주세요"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">SW 사용 목적</label>
                        <Textarea
                          value={ch.personality}
                          onChange={(e) => updateChar(idx, "personality", e.target.value)}
                          placeholder="이 SW를 통해 무엇을 얻고 싶어 하나요? 어떤 목적으로 사용하나요?"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">SW와의 관계</label>
                        <Textarea
                          value={ch.backstory}
                          onChange={(e) => updateChar(idx, "backstory", e.target.value)}
                          placeholder="이 SW가 이 대상에게 어떤 영향을 미치나요? 직접 사용자인가요, 간접 영향을 받나요?"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="text-xs font-medium px-4 py-2.5 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200 disabled:opacity-50"
            >
              저장
            </button>
            <button onClick={goNext} className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-[#C06070] text-white hover:bg-[#A8505F] transition-all duration-300">
              다음: 기능 설계 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </main>

        <aside className="w-72 flex-shrink-0 h-[calc(100vh-5rem)] sticky top-20">
          <AiChat
            step="character"
            initialMessage="이해관계자 분석을 도와드릴게요! 이 SW를 사용하게 될 주요 대상이 누구인가요? 어떤 사람들이 혜택을 받을지 생각해봐요."
            placeholder="이해관계자 분석에 대해 질문하세요..."
          />
        </aside>
      </div>
    </div>
  );
}
