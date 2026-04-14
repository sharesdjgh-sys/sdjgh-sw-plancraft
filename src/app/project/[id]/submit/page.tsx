"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import AiChat from "@/components/ai-assistant/AiChat";
import StepIndicator from "@/components/progress-tracker/StepIndicator";
import { Trophy, CheckCircle, Circle, ArrowLeft, Download } from "lucide-react";
import { getProject, updateProject } from "@/lib/storage";
import { downloadFullSummary } from "@/lib/download";
import { saveProjectToDir } from "@/lib/fileStorage";

const CHECKLIST = [
  { id: "idea", label: "아이디어 한 줄 소개가 명확하게 작성되었나요?" },
  { id: "problem", label: "해결하려는 문제의 배경과 필요성을 구체적으로 설명했나요?" },
  { id: "stakeholder", label: "주요 사용자와 이해관계자를 분석했나요?" },
  { id: "features", label: "핵심 기능 3~5가지가 명확하게 정의되었나요?" },
  { id: "proposal", label: "기획서 전체 내용이 논리적으로 연결되어 있나요?" },
  { id: "format", label: "공모전 제출 규정(파일 형식, 분량 등)을 확인했나요?" },
  { id: "proofread", label: "오탈자와 어색한 표현을 점검했나요?" },
  { id: "motivation", label: "지원 동기를 진심을 담아 작성했나요?" },
];

export default function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<ReturnType<typeof getProject>>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [authorNote, setAuthorNote] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const p = getProject(id);
    if (p) {
      setProject(p);
      setAuthorNote(p.authorNote ?? "");
      setCompleted(p.isCompleted ?? false);
      updateProject(id, { currentStep: Math.max(6, p.currentStep) });
    }
  }, [id]);

  const toggle = (key: string) => setChecks((c) => ({ ...c, [key]: !c[key] }));
  const checkedCount = Object.values(checks).filter(Boolean).length;
  const isReady = checkedCount === CHECKLIST.length;

  const markComplete = async () => {
    updateProject(id, { isCompleted: true });
    await saveProjectToDir(id, getProject(id));
    setCompleted(true);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6]">
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-5">
        <aside className="w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-4 sticky top-20 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <StepIndicator currentStep={project?.currentStep ?? 6} projectId={id} isCompleted={project?.isCompleted} />
          </div>
        </aside>

        <main className="flex-1 min-w-0 space-y-4">
          <div>
            <p className="text-[10px] font-medium text-[#D4547A] uppercase tracking-widest mb-1">Step 06</p>
            <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2">
              제출 준비 <Trophy className="w-5 h-5 text-[#D4547A]" />
            </h1>
          </div>

          {/* 진행률 */}
          <div className="bg-[#D4547A] rounded-2xl p-6 text-white shadow-[0_4px_24px_rgba(212,84,122,0.25)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-base font-bold">최종 점검 체크리스트</p>
                {project?.targetCompetition && (
                  <p className="text-white/70 text-xs mt-1">대상 대회: {project.targetCompetition}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{checkedCount}/{CHECKLIST.length}</p>
                <p className="text-white/70 text-xs">항목 완료</p>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${(checkedCount / CHECKLIST.length) * 100}%` }}
              />
            </div>
          </div>

          {/* 체크리스트 */}
          <div className="bg-white rounded-2xl border border-[#EBE7E0] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="px-5 py-4 border-b border-[#EBE7E0]">
              <p className="text-sm font-bold text-[#1A1A1A]">제출 전 확인 사항</p>
            </div>
            <div className="p-3">
              {CHECKLIST.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F4F1EC] transition-colors text-left"
                >
                  {checks[item.id] ? (
                    <CheckCircle className="w-4.5 h-4.5 text-[#D4547A] flex-shrink-0" />
                  ) : (
                    <Circle className="w-4.5 h-4.5 text-[#D4CFC9] flex-shrink-0" />
                  )}
                  <span className={`text-xs ${checks[item.id] ? "text-[#ADA8A0] line-through" : "text-[#1A1A1A]"}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 지원 동기 */}
          <div className="bg-white rounded-2xl border border-[#EBE7E0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">지원 동기 (선택)</label>
            <p className="text-[10px] text-[#ADA8A0] mb-3">이 아이디어를 공모전에 제출하게 된 계기, 문제 해결에 대한 열정, 심사위원에게 하고 싶은 말을 써봐요.</p>
            <Textarea
              placeholder="이 SW 아이디어를 떠올리게 된 계기와 공모전에 참여하는 이유를 자유롭게 써보세요."
              value={authorNote}
              onChange={(e) => {
                setAuthorNote(e.target.value);
                updateProject(id, { authorNote: e.target.value });
              }}
              rows={5}
            />
          </div>

          {/* 완료 / 대시보드 섹션 */}
          {completed ? (
            <div className="bg-[#D4547A] rounded-2xl p-6 text-center text-white">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="text-base font-bold mb-1">축하해요!</h3>
              <p className="text-xs text-white/80 mb-5">SW 기획서 작성을 완료했어요. 공모전에서 좋은 결과 있기를 응원해요!</p>
              <div className="flex items-center justify-center gap-3">
                {project && (
                  <button
                    onClick={() => downloadFullSummary(project)}
                    className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-200"
                  >
                    <Download className="w-3.5 h-3.5" /> 최종 요약 다운로드
                  </button>
                )}
                <Link href="/dashboard">
                  <button className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-white text-[#D4547A] hover:bg-white/90 transition-all duration-200">
                    대시보드로 돌아가기
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-[#F4F1EC] border border-[#EBE7E0] rounded-2xl p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">
                    {isReady ? "모든 준비가 완료됐어요! 🎉" : `체크리스트 ${checkedCount}/${CHECKLIST.length} 완료`}
                  </h3>
                  <p className="text-xs text-[#7A7067] mt-1">
                    {isReady
                      ? "훌륭한 SW 기획서를 완성했네요. 완료 처리 후 대시보드로 돌아가세요."
                      : "위 체크리스트를 모두 확인하면 완료 버튼이 활성화돼요."}
                  </p>
                </div>
                <button
                  onClick={markComplete}
                  disabled={!isReady}
                  className={`flex-shrink-0 text-xs font-semibold px-5 py-2.5 rounded-full transition-all duration-300 ${
                    isReady
                      ? "bg-[#D4547A] text-white hover:bg-[#B8405F] shadow-[0_4px_16px_rgba(212,84,122,0.25)]"
                      : "bg-[#EBE7E0] text-[#ADA8A0] cursor-not-allowed"
                  }`}
                >
                  기획서 완성 완료
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Link href={`/project/${id}/script`}>
              <button className="flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-full border border-[#EBE7E0] text-[#7A7067] hover:bg-[#F4F1EC] transition-all duration-200">
                <ArrowLeft className="w-3.5 h-3.5" /> 이전: 기획서 작성
              </button>
            </Link>
            {!completed && project && (
              <button
                onClick={() => downloadFullSummary(project)}
                className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full border border-[#D4547A]/30 text-[#D4547A] hover:bg-[#D4547A]/5 transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5" /> 최종 요약 다운로드
              </button>
            )}
          </div>
        </main>

        <aside className="w-72 flex-shrink-0 h-[calc(100vh-5rem)] sticky top-20">
          <AiChat
            step="completion"
            initialMessage="거의 다 왔어요! 제출 전 최종 점검을 도와드릴게요. 지원 동기 작성이나 기획서 마지막 검토에서 도움이 필요하시면 말씀해 주세요!"
            placeholder="마지막 점검에 도움을 요청하세요..."
          />
        </aside>
      </div>
    </div>
  );
}
