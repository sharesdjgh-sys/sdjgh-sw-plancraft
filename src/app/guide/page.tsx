import Link from "next/link";
import { ArrowRight, Lightbulb, BookOpen, Users, Film, PenLine, Trophy, Sparkles } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const GUIDE_STEPS = [
  { icon: Lightbulb, step: 1, title: "아이디어 발굴", time: "1~2일", desc: "웹툰의 주제, 장르, 소재를 정하는 단계예요.",
    tips: ["좋아하는 것, 관심 있는 것에서 시작해요", "일상 속 감동이나 불편함을 소재로 삼아봐요", "대회 주제와 연결될 수 있는 아이디어를 찾아봐요", "AI 멘토와 대화하며 아이디어를 발전시켜봐요"] },
  { icon: BookOpen, step: 2, title: "스토리 구성", time: "2~3일", desc: "기승전결 구조로 전체 이야기의 뼈대를 세워요.",
    tips: ["한 줄 소개(로그라인)를 먼저 써봐요", "주인공의 목표가 무엇인지 명확히 해요", "갈등과 위기가 있어야 재미있는 이야기가 돼요", "결말은 주인공이 성장하는 모습을 담아요"] },
  { icon: Users, step: 3, title: "캐릭터 설계", time: "2일", desc: "독자가 사랑할 입체적인 캐릭터를 만들어요.",
    tips: ["주인공에게 장점과 단점을 모두 부여해요", "각 캐릭터의 목표와 동기를 명확히 해요", "외모 묘사는 특징적인 요소를 중심으로 구체적으로", "캐릭터 간 관계가 이야기를 더 풍부하게 해요"] },
  { icon: Film, step: 4, title: "콘티 제작", time: "3~5일", desc: "장면 배치와 연출을 계획하는 단계예요.",
    tips: ["각 장면의 앵글을 다양하게 활용해요", "클로즈업은 감정 표현, 풀샷은 상황 설명에 효과적", "여백도 연출의 일부예요", "말풍선 위치와 크기가 가독성에 영향을 줘요"] },
  { icon: PenLine, step: 5, title: "대본 작성", time: "3~5일", desc: "각 장면의 대사와 지문을 완성해요.",
    tips: ["대사는 자연스럽게, 소리내어 읽어봐요", "나레이션은 꼭 필요한 것만 간결하게", "효과음은 분위기를 살려주는 중요한 요소예요", "각 화는 다음 화가 궁금하게 끝나면 좋아요"] },
  { icon: Trophy, step: 6, title: "제출 준비", time: "1~2일", desc: "작품을 다듬고 대회 규정에 맞게 준비해요.",
    tips: ["전체를 처음부터 끝까지 다시 읽어봐요", "오탈자와 문법 오류를 꼼꼼히 확인해요", "대회 파일 형식과 페이지 수 규정을 꼭 확인해요", "작가 노트에 진심을 담아 써봐요"] },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-[#FBF9F6]">
      <header className="bg-white border-b border-[#EBE7E0] px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#C06070] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#1A1A1A] tracking-tight">웹툰 메이커 AI</span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 bg-[#C06070] text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#A8505F] transition-all duration-300">
            시작하기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <ScrollReveal>
          <div className="mb-12">
            <p className="text-xs font-medium text-[#C06070] uppercase tracking-widest mb-3">Guide</p>
            <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight mb-3">
              웹툰 제작 완벽 가이드
            </h1>
            <p className="text-sm text-[#7A7067] leading-relaxed">
              처음이어도 괜찮아요. 6단계로 나만의 웹툰을 완성해봐요.
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
                    <div className="w-11 h-11 rounded-xl bg-[#C06070]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#C06070]" />
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
                            <div className="w-1 h-1 rounded-full bg-[#C06070] flex-shrink-0 mt-1.5" />
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
          <div className="mt-10 relative overflow-hidden bg-[#1A1A1A] rounded-3xl p-10 text-center">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#C06070] blob opacity-20 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[#C06070] text-xs font-medium tracking-widest uppercase mb-4">지금 바로</p>
              <h2 className="text-2xl font-bold text-white tracking-tight mb-3">시작할 준비가 됐나요?</h2>
              <p className="text-sm text-white/45 mb-8 leading-relaxed">AI 멘토가 첫 질문부터 마지막 제출까지 함께해요.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-[#C06070] text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#A8505F] transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_24px_rgba(192,96,112,0.4)]">
                무료로 시작하기 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
}
