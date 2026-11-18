"use client";

import ProjectWorkspace from "@/components/project-workspace/ProjectWorkspace";
import workspaceStyles from "@/components/project-workspace/workspace.module.css";

import { useEffect, use, useRef } from "react";
import { useProject } from "@/lib/use-project";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { type AiChatHandle } from "@/components/ai-assistant/AiChat";
import { CheckCircle, Circle, Download } from "lucide-react";
import { getProject, updateProject } from "@/lib/storage";
import { downloadFullSummary } from "@/lib/download";
import { saveProjectToDir } from "@/lib/fileStorage";

const STUDENT_CHECKLIST = [
  { id: "idea", label: "아이디어 한 줄 소개가 명확하게 작성되었나요?" },
  { id: "problem", label: "해결하려는 문제의 배경과 필요성을 구체적으로 설명했나요?" },
  { id: "stakeholder", label: "주요 사용자와 이해관계자를 분석했나요?" },
  { id: "features", label: "핵심 기능 3~5가지가 명확하게 정의되었나요?" },
  { id: "proposal", label: "기획서 전체 내용이 논리적으로 연결되어 있나요?" },
  { id: "format", label: "공모전 제출 규정(파일 형식, 분량 등)을 확인했나요?" },
  { id: "proofread", label: "오탈자와 어색한 표현을 점검했나요?" },
  { id: "motivation", label: "지원 동기를 진심을 담아 작성했나요?" },
];

const GENERAL_CHECKLIST = [
  { id: "idea", label: "서비스 한 줄 소개가 대상 사용자에게 이해하기 쉽게 작성되었나요?" },
  { id: "problem", label: "해결하려는 문제의 배경과 필요성을 구체적으로 설명했나요?" },
  { id: "stakeholder", label: "서비스를 사용할 사람과 운영자 등 이해관계자를 분석했나요?" },
  { id: "features", label: "핵심 기능 3~5가지가 바이브코딩으로 구현 가능한 수준인가요?" },
  { id: "proposal", label: "기획서 전체 내용이 논리적으로 연결되어 있나요?" },
  { id: "format", label: "공유/제출용 문서 형식(분량, 구성, 전달 대상)을 점검했나요?" },
  { id: "proofread", label: "오탈자와 어색한 표현을 점검했나요?" },
  { id: "motivation", label: "이 서비스를 기획한 배경과 목적을 명확히 담았나요?" },
];

export default function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const project = useProject(id);
  const checks = project?.reviewChecks ?? {};
  const authorNote = project?.authorNote ?? "";
  const completed = project?.isCompleted ?? false;
  const aiChatRef = useRef<AiChatHandle>(null);

  useEffect(() => {
    const p = getProject(id);
    if (p && p.currentStep < 6) updateProject(id, { currentStep: 6 });
  }, [id]);

  const userType = project?.userType ?? "student";
  const checklist = userType === "general" ? GENERAL_CHECKLIST : STUDENT_CHECKLIST;
  const completionInitialMessage =
    userType === "general"
      ? "기획 마무리 단계예요. 서비스 완성도와 바이브코딩 구현 가능성을 함께 점검해볼까요? 마지막 검토나 기획 배경 작성이 필요하면 도와드릴게요."
      : "거의 다 왔어요! 제출 전 최종 점검을 도와드릴게요. 지원 동기 작성이나 기획서 마지막 검토에서 도움이 필요하시면 말씀해 주세요!";

  const toggle = (key: string) => updateProject(id, { reviewChecks: { ...checks, [key]: !checks[key] } });
  const checkedCount = checklist.filter((item) => checks[item.id]).length;
  const isReady = checkedCount === checklist.length;

  const markComplete = async () => {
    updateProject(id, { isCompleted: true });
    await saveProjectToDir(id, getProject(id));

  };

  return (
    <>

      <ProjectWorkspace
        projectId={id}
        step={6}
        mentorStep="completion"
        mentorRef={aiChatRef}
        mentorMessage={completionInitialMessage}
        mentorPlaceholder="마지막 점검에 도움을 요청하세요..."

        actions={<><button disabled={!project} onClick={() => { if (project) downloadFullSummary(project); }}><Download size={14} />최종 요약 다운로드</button></>}
      >
        <div className={workspaceStyles.reviewProgress}><div><span>최종 점검 체크리스트</span><strong>{checkedCount} / {checklist.length}</strong><p>실제로 확인한 항목을 체크해주세요.</p></div><progress value={checkedCount} max={checklist.length} aria-label="최종 점검 진행률" /></div>
{/* 체크리스트 */}
          <div className="bg-white rounded-2xl border border-[#EBE7E0] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="px-5 py-4 border-b border-[#EBE7E0]">
              <p className="text-sm font-bold text-[#1A1A1A]">제출 전 확인 사항</p>
            </div>
            <div className="p-3">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  role="checkbox"
                  aria-checked={!!checks[item.id]}
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
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">{userType === "general" ? "메모 / 전달 메시지 (선택)" : "지원 동기 (선택)"}</label>
            <p className="text-[10px] text-[#ADA8A0] mb-3">{userType === "general" ? "문서를 공유할 때 전달하고 싶은 핵심 메시지나 실행 계획 메모를 자유롭게 남겨보세요." : "이 아이디어를 공모전에 제출하게 된 계기, 문제 해결에 대한 열정, 심사위원에게 하고 싶은 말을 써봐요."}</p>
            <Textarea
              placeholder={userType === "general" ? "이 기획의 목적, 기대 효과, 공유 시 강조할 포인트를 자유롭게 써보세요." : "이 SW 아이디어를 떠올리게 된 계기와 공모전에 참여하는 이유를 자유롭게 써보세요."}
              value={authorNote}
              onChange={(e) => {

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
              <p className="text-xs text-white/80 mb-5">{userType === "general" ? "서비스 기획이 완성됐어요! 이제 바이브코딩으로 직접 만들어봐요." : "SW 기획서 작성을 완료했어요. 공모전에서 좋은 결과 있기를 응원해요!"}</p>
              <div className="flex items-center justify-center gap-3">
                {project && (
                  <button
                    onClick={() => downloadFullSummary(project)}
                    className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-200"
                  >
                    <Download className="w-3.5 h-3.5" /> 최종 요약 다운로드
                  </button>
                )}
                <Link href={userType === "general" ? "/dashboard?type=general" : "/dashboard"}>
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
                    {isReady ? "모든 준비가 완료됐어요! 🎉" : `체크리스트 ${checkedCount}/${checklist.length} 완료`}
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
      </ProjectWorkspace>
    </>
  );
}
