import Link from "next/link";
import {
  ArrowRight, Lightbulb, Target, Users, Cpu,
  PenLine, Trophy, Star, Heart
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const STEPS = [
  { icon: Lightbulb, label: "아이디어 발굴", desc: "AI와 함께 공모전 아이디어 브레인스토밍" },
  { icon: Target,    label: "문제 정의",     desc: "해결할 문제와 배경을 구체적으로 명확화" },
  { icon: Users,     label: "이해관계자 분석", desc: "누구를 위한 SW인지 사용자와 환경 파악" },
  { icon: Cpu,       label: "기능 설계",     desc: "핵심 기능 구성과 구현 흐름 계획" },
  { icon: PenLine,   label: "기획서 작성",   desc: "공모전 수준의 기획서 완성" },
  { icon: Trophy,    label: "최종 검토",     desc: "공모전 규정 점검 및 제출 준비" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FBF9F6] text-[#1A1A1A] overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#FBF9F6]/85 backdrop-blur-xl border-b border-[#EBE7E0]">
        <div className="flex items-center gap-2">
          <img src="/plancraft-logo.jpg" className="w-7 h-7 rounded-lg object-cover" alt="PlanCraft" />
          <span className="text-sm font-semibold tracking-tight text-[#1A1A1A]">PlanCraft</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/guide" className="text-sm text-[#7A7067] hover:text-[#1A1A1A] transition-colors duration-200">
            가이드
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 bg-[#1A1A1A] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#2D2D2D] transition-all duration-300 hover:scale-[1.02]"
          >
            시작하기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[100dvh] flex items-center px-8 pt-20 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-24 right-[8%] w-[420px] h-[420px] bg-[#C06070] blob blob-anim pointer-events-none" />
        <div className="absolute bottom-12 left-[5%] w-[280px] h-[280px] bg-[#E8C9A0] blob pointer-events-none opacity-25" />

        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-16 items-center py-16">
          <div>
            {/* Badge */}
            <div className="hero-enter inline-flex items-center gap-2 border border-[#C06070]/25 bg-[#C06070]/[0.07] text-[#C06070] px-3.5 py-1.5 rounded-full text-xs font-medium mb-7">
              <Star className="w-3 h-3 fill-[#C06070]" />
              SW 아이디어 공모전 공식 준비 플랫폼
            </div>

            {/* Headline */}
            <h1 className="hero-enter-2 text-[clamp(2.6rem,6vw,4.5rem)] font-bold tracking-tight leading-[1.08] mb-6">
              내 아이디어를<br />
              <span className="font-serif italic text-[#C06070]">기획서</span>로<br />
              완성해봐요
            </h1>

            <p className="hero-enter-3 text-[#7A7067] text-lg leading-relaxed max-w-md mb-10">
              아이디어가 막막해도 괜찮아요.<br />
              AI 멘토가 아이디어 발굴부터 기획서 제출까지<br />
              6단계 전 과정을 함께해요.
            </p>

            <div className="hero-enter-3 flex items-center gap-4 flex-wrap">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-[#C06070] text-white px-6 py-3.5 rounded-full font-semibold text-sm hover:bg-[#A8505F] transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_24px_rgba(192,96,112,0.35)]"
              >
                지금 시작하기 <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/guide"
                className="text-sm text-[#7A7067] hover:text-[#1A1A1A] transition-colors duration-200 underline underline-offset-4 decoration-[#EBE7E0]"
              >
                준비 가이드 보기
              </Link>
            </div>
          </div>

          {/* Preview card */}
          <div className="hidden lg:block hero-enter-3">
            <div className="bg-white rounded-3xl border border-[#EBE7E0] p-6 shadow-[0_8px_48px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-medium text-[#ADA8A0] uppercase tracking-wider">진행 중인 프로젝트</span>
                <span className="text-[10px] bg-[#C06070]/10 text-[#C06070] px-2.5 py-1 rounded-full font-medium">3 / 6단계</span>
              </div>
              <p className="text-base font-bold text-[#1A1A1A] mb-1">급식 잔반 줄이기 앱</p>
              <p className="text-xs text-[#ADA8A0] mb-4">교육 · SW 아이디어 공모전</p>

              <div className="w-full bg-[#F4F1EC] rounded-full h-1.5 mb-5">
                <div className="bg-[#C06070] h-1.5 rounded-full" style={{ width: "45%" }} />
              </div>

              <div className="space-y-2">
                {[
                  { label: "문제 정의", done: true },
                  { label: "이해관계자 분석", done: true },
                  { label: "기능 설계", done: false, current: true },
                  { label: "기획서 작성", done: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs ${
                      item.done ? "bg-[#F4F1EC] text-[#ADA8A0]" :
                      item.current ? "bg-[#C06070]/8 text-[#C06070] border border-[#C06070]/15" :
                      "text-[#D4CFC9]"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      item.done ? "bg-[#ADA8A0]" : item.current ? "bg-[#C06070]" : "bg-[#EBE7E0]"
                    }`} />
                    <span>{item.label}</span>
                    {item.done && <span className="ml-auto text-[10px]">완료</span>}
                    {item.current && <span className="ml-auto text-[10px] font-semibold">진행중</span>}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-[#EBE7E0]">
                <div className="flex items-start gap-2.5">
                  <img src="/plancraft-logo.jpg" className="w-6 h-6 rounded-lg object-cover flex-shrink-0 mt-0.5" alt="" />
                  <div>
                    <p className="text-[10px] text-[#ADA8A0] mb-0.5">AI 멘토 아이디어봇</p>
                    <p className="text-xs text-[#7A7067] leading-relaxed">이해관계자 분석이 완성됐어요! 이제 핵심 기능 설계부터 함께 잡아봐요.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6단계 */}
      <section className="px-8 py-24 max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-[#C06070] uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-3xl font-bold tracking-tight">
              아이디어에서 기획서까지,<br />
              <span className="font-serif italic">딱 6단계</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.label} delay={i * 55}>
                <div className="group bg-white rounded-2xl border border-[#EBE7E0] p-5 hover:border-[#C06070]/30 hover:shadow-[0_4px_24px_rgba(192,96,112,0.08)] transition-all duration-300 cursor-default">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F1EC] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C06070]/10 transition-colors duration-300">
                      <Icon className="w-4.5 h-4.5 text-[#7A7067] group-hover:text-[#C06070] transition-colors duration-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-[#ADA8A0]">{String(i + 1).padStart(2, "0")}</span>
                        <h3 className="text-sm font-semibold text-[#1A1A1A]">{step.label}</h3>
                      </div>
                      <p className="text-xs text-[#ADA8A0] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* Bento features */}
      <section className="px-8 pb-24 max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-[#C06070] uppercase tracking-widest mb-3">Why us</p>
            <h2 className="text-3xl font-bold tracking-tight">
              끝까지 완성할 수 있는<br />
              <span className="font-serif italic">이유가 있어요</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ScrollReveal delay={0} className="h-full">
            <div className="h-full bg-white rounded-3xl border border-[#EBE7E0] p-8 hover:shadow-[0_4px_32px_rgba(0,0,0,0.05)] transition-all duration-300">
              <img src="/plancraft-logo.jpg" className="w-10 h-10 rounded-xl object-cover mb-5" alt="" />
              <h3 className="text-xl font-bold tracking-tight mb-2">AI 멘토 아이디어봇</h3>
              <p className="text-sm text-[#7A7067] leading-relaxed max-w-sm">
                각 단계마다 전문 AI가 질문에 답하고, 막힌 부분을 함께 돌파해요. 혼자 고민하지 않아도 돼요.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80} className="h-full">
            <div className="h-full bg-[#C06070] rounded-3xl p-8 text-white hover:shadow-[0_4px_32px_rgba(192,96,112,0.3)] transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-5">
                <Heart className="w-4.5 h-4.5 text-white" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2">처음이어도 OK</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                코딩 경험이 없어도, 기획서를 써본 적 없어도. AI가 처음부터 함께해요.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120} className="h-full">
            <div className="h-full bg-white rounded-3xl border border-[#EBE7E0] p-8 hover:shadow-[0_4px_32px_rgba(0,0,0,0.05)] transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-[#F4F1EC] flex items-center justify-center mb-5">
                <Trophy className="w-4.5 h-4.5 text-[#7A7067]" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2">공모전 맞춤 일정</h3>
              <p className="text-sm text-[#7A7067] leading-relaxed">
                마감일을 입력하면 단계별 일정을 자동으로 계산해 드려요.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={160} className="h-full">
            <div className="h-full bg-[#F4F1EC] rounded-3xl border border-[#EBE7E0] p-8 hover:shadow-[0_4px_32px_rgba(0,0,0,0.05)] transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-5">
                <PenLine className="w-4.5 h-4.5 text-[#7A7067]" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2">기능 설계 & 기획서 편집기</h3>
              <p className="text-sm text-[#7A7067] leading-relaxed max-w-sm">
                기능을 체계적으로 구성하고, AI가 기획서 방향을 제안해요. 막히면 바로 멘토에게 물어봐요.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonial-style quote */}
      <ScrollReveal>
        <section className="px-8 pb-24">
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#EBE7E0] p-10 text-center shadow-[0_4px_32px_rgba(0,0,0,0.04)]">
            <div className="text-3xl font-serif italic text-[#C06070] mb-6">"</div>
            <p className="text-lg font-medium text-[#1A1A1A] leading-relaxed tracking-tight mb-6">
              아이디어는 있었는데 어떻게 기획서로 정리할지 몰랐어요.<br />
              AI 멘토와 대화하다보니 어느새 기획서가 완성됐어요.
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#F4F1EC] flex items-center justify-center">
                <span className="text-xs font-bold text-[#C06070]">김</span>
              </div>
              <span className="text-xs text-[#ADA8A0]">김○○, 고등학교 2학년 · 공모전 최우수상 수상</span>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal>
        <section className="px-8 pb-28 max-w-6xl mx-auto">
          <div className="relative overflow-hidden bg-[#C06070] rounded-3xl p-12 text-center">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white blob opacity-10 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-4">지금 바로</p>
              <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
                공모전 참가를 망설이고 있나요?
              </h2>
              <p className="text-white/70 text-sm mb-8 leading-relaxed">
                처음이어도 괜찮아요. AI 멘토가 첫 아이디어부터 마지막 제출까지 함께해요.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-white text-[#C06070] px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-[#FBF9F6] transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
              >
                무료로 시작하기 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Footer */}
      <footer className="border-t border-[#EBE7E0] px-8 py-8 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/plancraft-logo.jpg" className="w-5 h-5 rounded object-cover" alt="PlanCraft" />
            <span className="text-xs text-[#ADA8A0] font-medium">PlanCraft</span>
          </div>
          <p className="text-xs text-[#ADA8A0]">© 2026 PlanCraft</p>
        </div>
      </footer>
    </div>
  );
}
