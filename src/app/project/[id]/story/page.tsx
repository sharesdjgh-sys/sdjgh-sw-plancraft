"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import AiChat from "@/components/ai-assistant/AiChat";
import StepIndicator from "@/components/progress-tracker/StepIndicator";
import { Save, ArrowRight, Sparkles, Check, Download } from "lucide-react";
import { getProject, updateProject, type Project } from "@/lib/storage";
import { downloadStory } from "@/lib/download";

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [story, setStory] = useState({ logline: "", theme: "", setting: "", plotOutline: "", totalEpisodes: "1" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProject(id);
    if (p) { setProject(p); setStory(p.story); }
  }, [id]);

  const save = () => {
    setSaving(true);
    updateProject(id, {
      story: { ...story },
      currentStep: Math.max(2, project?.currentStep ?? 1),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6]">
      <header className="bg-white border-b border-[#EBE7E0] px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-[#ADA8A0] hover:text-[#7A7067] transition-colors flex-shrink-0">
              <Sparkles className="w-3 h-3 text-[#C06070]" /> 대시보드
            </Link>
            <span className="text-[#EBE7E0]">/</span>
            <span className="text-xs font-semibold text-[#1A1A1A] truncate">{project?.title ?? "..."}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {project && (
              <button
                onClick={() => downloadStory({ ...project, story })}
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5" /> 다운로드
              </button>
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
            <StepIndicator currentStep={project?.currentStep ?? 1} projectId={id} />
          </div>
        </aside>

        <main className="flex-1 min-w-0 space-y-4">
          <div className="mb-2">
            <p className="text-[10px] font-medium text-[#C06070] uppercase tracking-widest mb-1">Step 02</p>
            <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">스토리 구성</h1>
          </div>

          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">한 줄 소개 (로그라인)</label>
            <p className="text-[10px] text-[#ADA8A0] mb-3">독자가 읽었을 때 이야기가 궁금해지는 한 문장</p>
            <Input placeholder="예: 마법을 잃은 마법사가 평범한 고등학생이 되어 사건을 해결하는 이야기" value={story.logline} onChange={(e) => setStory((s) => ({ ...s, logline: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">주제 / 메시지</label>
              <p className="text-[10px] text-[#ADA8A0] mb-3">독자에게 전달하고 싶은 메시지</p>
              <Textarea placeholder="이 웹툰으로 독자에게 전달하고 싶은 메시지는 무엇인가요?" value={story.theme} onChange={(e) => setStory((s) => ({ ...s, theme: e.target.value }))} rows={4} />
            </div>
            <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">배경 / 세계관</label>
              <p className="text-[10px] text-[#ADA8A0] mb-3">이야기가 펼쳐지는 시간과 공간</p>
              <Textarea placeholder="배경 설정을 설명해주세요" value={story.setting} onChange={(e) => setStory((s) => ({ ...s, setting: e.target.value }))} rows={4} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">전체 줄거리 (기승전결)</label>
            <p className="text-[10px] text-[#ADA8A0] mb-3">이야기의 흐름을 4단계로 정리해보세요</p>
            <Textarea
              placeholder={`기: 주인공 소개와 사건의 발단\n승: 갈등이 심화되는 과정\n전: 가장 큰 위기와 반전\n결: 결말과 해결`}
              value={story.plotOutline}
              onChange={(e) => setStory((s) => ({ ...s, plotOutline: e.target.value }))}
              rows={10}
            />
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#EBE7E0]">
              <label className="text-xs font-semibold text-[#1A1A1A] whitespace-nowrap">총 화 수</label>
              <Input type="number" min="1" max="100" value={story.totalEpisodes} onChange={(e) => setStory((s) => ({ ...s, totalEpisodes: e.target.value }))} className="w-20" />
              <span className="text-xs text-[#ADA8A0]">화</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={save} disabled={saving} className="text-xs font-medium px-4 py-2.5 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200 disabled:opacity-50">
              저장
            </button>
            <Link href={`/project/${id}/characters`}>
              <button className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-[#C06070] text-white hover:bg-[#A8505F] transition-all duration-300">
                다음: 캐릭터 설계 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </main>

        <aside className="w-72 flex-shrink-0 h-[calc(100vh-5rem)] sticky top-20">
          <AiChat step="story" initialMessage="안녕하세요! 스토리 구성을 도와드릴게요. 어떤 이야기를 만들고 싶으신가요?" placeholder="스토리에 대해 질문하세요..." />
        </aside>
      </div>
    </div>
  );
}
