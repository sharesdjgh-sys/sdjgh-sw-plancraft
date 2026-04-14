import Link from "next/link";
import { ArrowRight, Lightbulb, Target, Users, Cpu, PenLine, Trophy } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const GUIDE_STEPS = [
  { icon: Lightbulb, step: 1, title: "아이디어 발굴", time: "1~2일", desc: "해결하고 싶은 사회 문제나 불편함을 SW로 풀 아이디어를 찾는 단계예요.",
    tips: ["일상 속 불편하거나 개선하고 싶은 점을 찾아봐요", "학교, 지역사회, 환경 등 주변 문제에 관심을 가져요", "공모전 주제 '창의적 코딩 활동'과 연결되는 아이디어를 탐색해요", "AI 멘토와 자유롭게 대화하며 아이디어를 구체화해봐요"] },
  { icon: Target, step: 2, title: "문제 정의", time: "1~2일", desc: "해결하려는 문제의 핵심을 명확하게 정리하는 단계예요.",
    tips: ["문제를 한 문장으로 표현해봐요 (아이디어 한 줄 소개)", "왜 이 문제가 중요한지 배경과 필요성을 설명해봐요", "현재 어떤 불편함이 있는지 구체적인 상황을 써봐요", "SW가 어떤 방식으로 문제를 해결하는지 기능 개요를 잡아봐요"] },
  { icon: Users, step: 3, title: "이해관계자 분석", time: "1~2일", desc: "SW가 도움을 줄 사람들을 구체적으로 파악하는 단계예요.",
    tips: ["주요 사용자가 누구인지 (연령, 특성, 불편함) 명확히 해요", "사용자 외에 영향을 받는 이해관계자도 파악해요", "각 대상이 SW에서 무엇을 원하는지 생각해봐요", "실제로 사용하는 장면을 상상하며 사용자를 구체화해봐요"] },
  { icon: Cpu, step: 4, title: "기능 설계", time: "2~3일", desc: "SW의 핵심 기능과 동작 흐름을 설계하는 단계예요.",
    tips: ["핵심 기능 3~5가지를 명확하게 정리해봐요", "각 기능의 입력·처리·출력 흐름을 구체화해봐요", "고등학생이 실제 구현 가능한 기술 스택을 선택해요", "기능이 너무 복잡하면 핵심에 집중해서 줄여봐요"] },
  { icon: PenLine, step: 5, title: "기획서 작성", time: "2~3일", desc: "공모전에 제출할 기획서를 완성하는 단계예요.",
    tips: ["배경→목적→기능→기술→기대효과 순서로 구성해요", "문제 정의와 해결 방안이 논리적으로 연결되는지 확인해요", "기대 효과는 구체적인 수치나 사례로 뒷받침해봐요", "어색한 표현 없이 자연스러운 문장으로 다듬어요"] },
  { icon: Trophy, step: 6, title: "최종 검토", time: "1일", desc: "기획서를 완성하고 공모전 규정에 맞게 점검하는 단계예요.",
    tips: ["기획서 전체 흐름을 처음부터 끝까지 다시 읽어봐요", "문제 정의, 기능, 기대 효과의 일관성을 확인해요", "공모전 제출 형식과 규정을 꼼꼼히 확인해요", "지원 동기에 진심을 담아 써봐요"] },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-[#FBF9F6]">
      <header className="bg-white border-b border-[#EBE7E0] px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/plancraft-logo.jpg" className="w-6 h-6 rounded-lg object-cover" alt="PlanCraft" />
            <span className="text-sm font-semibold text-[#1A1A1A] tracking-tight">PlanCraft</span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 bg-[#D4547A] text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#B8405F] transition-all duration-300">
            시작하기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <ScrollReveal>
          <div className="mb-12">
            <p className="text-xs font-medium text-[#D4547A] uppercase tracking-widest mb-3">Guide</p>
            <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight mb-3">
              SW 아이디어 공모전 가이드
            </h1>
            <p className="text-sm text-[#7A7067] leading-relaxed">
              처음이어도 괜찮아요. 6단계로 공모전 기획서를 완성해봐요.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {GUIDE_STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <ScrollReveal key={s.step} delay={idx * 55}>
                <div className="bg-white rounded-2xl border border-[#EBE7E0] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <div className="flex items-start gap-5">
                    <div className="w-11 h-11 rounded-xl bg-[#D4547A]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#D4547A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-mono text-[#ADA8A0]">STEP {String(s.step).padStart(2, "0")}</span>
                        <span className="text-[10px] border border-[#EBE7E0] text-[#ADA8A0] px-2.5 py-0.5 rounded-full bg-[#F4F1EC]">예상 {s.time}</span>
                      </div>
                      <h3 className="text-base font-bold text-[#1A1A1A] tracking-tight mb-1">{s.title}</h3>
                      <p className="text-xs text-[#7A7067] mb-4 leading-relaxed">{s.desc}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {s.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-[#7A7067] bg-[#FBF9F6] rounded-xl px-3 py-2.5 border border-[#EBE7E0]">
                            <div className="w-1 h-1 rounded-full bg-[#D4547A] flex-shrink-0 mt-1.5" />
                            <span className="leading-relaxed">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal>
          <div className="mt-10 relative overflow-hidden bg-[#D4547A] rounded-3xl p-10 text-center">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white blob opacity-10 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-4">지금 바로</p>
              <h2 className="text-2xl font-bold text-white tracking-tight mb-3">시작할 준비가 됐나요?</h2>
              <p className="text-sm text-white/70 mb-8 leading-relaxed">AI 멘토가 첫 질문부터 마지막 제출까지 함께해요.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-white text-[#D4547A] px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#FBF9F6] transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
                무료로 시작하기 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
}
