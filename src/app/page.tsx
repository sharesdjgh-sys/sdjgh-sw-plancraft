import Link from "next/link";
import {
  ArrowRight, Lightbulb, Target, Users, Cpu,
  PenLine, Trophy, Heart, GraduationCap, BookOpen
} from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import BrandMark from "@/components/brand/BrandMark";
import HeroIdeaScene from "@/components/home/HeroIdeaScene";
import styles from "./home.module.css";

const STEP_COLORS = [
  "#D4547A", // 01 Rose
  "#E06E48", // 02 Coral
  "#D49E40", // 03 Amber
  "#50A882", // 04 Sage
  "#8060C0", // 05 Violet
  "#B85890", // 06 Mauve
];

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
      <nav className={styles.navigation + " fixed top-0 left-0 right-0 z-50 h-[65px] flex items-center justify-between px-4 sm:px-8 bg-[#FBF9F6]/85 backdrop-blur-xl border-b border-[#EBE7E0]"}>
        <Link href="/" aria-label="PlanCraft 홈"><BrandMark /></Link>
        <div className="flex items-center gap-2 sm:gap-5">
          <Link href="/guide" className="text-xs sm:text-sm text-[#7A7067] hover:text-[#1A1A1A] transition-colors duration-200">
            가이드
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 bg-[#1A1A1A] text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full hover:bg-[#2D2D2D] transition-all duration-300 hover:scale-[1.02]"
          >
            시작하기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy + " hero-enter"}>
            <p className={styles.eyebrow}><Lightbulb size={16} aria-hidden="true" /> 학생의 상상부터, 선생님의 수업까지</p>
            <h1 id="hero-title" className={styles.heroTitle}>해보고 싶은 생각,<br /><span>기획으로 꺼내봐요.</span></h1>
            <p className={styles.heroLead}>학교에서 느낀 불편함도, 수업을 바꿀 아이디어도.<br className={styles.desktopBreak} /> 아이디어봇과 이야기하며 <strong>만들어보고 싶은 것</strong>을<br className={styles.desktopBreak} /> 나만의 기획서로 정리해보세요.</p>
            <div className={styles.heroActions}>
              <Link href="/dashboard?type=student" className={styles.studentAction} aria-label="학생으로 내 아이디어 꺼내기">
                <GraduationCap size={22} aria-hidden="true" />
                <span><small>학생</small><strong>내 아이디어 꺼내기</strong></span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/dashboard?type=general" className={styles.teacherAction} aria-label="선생님으로 수업 아이디어 기획하기">
                <BookOpen size={21} aria-hidden="true" />
                <span><small>선생님</small><strong>수업 아이디어 기획하기</strong></span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <p className={styles.reassurance}>아이디어가 아직 없어도 괜찮아요. 첫 질문부터 함께해요.</p>
            <Link href="/guide" className={styles.guideLink}>어떻게 시작하나요? <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
          <div className={styles.heroScene + " hero-enter-3"}><HeroIdeaScene /></div>
        </div>
      </section>

      {/* 6단계 */}
      <section className="px-8 py-24 max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-[#D4547A] uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-3xl font-bold tracking-tight">
              아이디어에서 기획서까지,<br />
              <span>딱 6단계</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const color = STEP_COLORS[i];
            return (
              <ScrollReveal key={step.label} delay={i * 55}>
                <div className="rounded-2xl border border-[#EBE7E0] p-5 transition-all duration-300 cursor-default" style={{ backgroundColor: color + "0d" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "1a" }}>
                      <Icon className="w-4.5 h-4.5" style={{ color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-semibold" style={{ color }}>{String(i + 1).padStart(2, "0")}</span>
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
            <p className="text-xs font-medium text-[#D4547A] uppercase tracking-widest mb-3">Why us</p>
            <h2 className="text-3xl font-bold tracking-tight">
              끝까지 완성할 수 있는<br />
              <span>이유가 있어요</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ScrollReveal delay={0} className="h-full">
            <div className="h-full bg-white rounded-3xl border border-[#EBE7E0] p-8 hover:shadow-[0_4px_32px_rgba(0,0,0,0.05)] transition-all duration-300">
              <img src="/plancraft-logo-remove.png" className="w-10 h-10 rounded-xl object-cover mb-5" alt="" />
              <h3 className="text-xl font-bold tracking-tight mb-2">AI 멘토 아이디어봇</h3>
              <p className="text-sm text-[#7A7067] leading-relaxed max-w-sm">
                각 단계마다 전문 AI가 질문에 답하고, 막힌 부분을 함께 돌파해요. 혼자 고민하지 않아도 돼요.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80} className="h-full">
            <div className="h-full bg-[#D4547A] rounded-3xl p-8 text-white hover:shadow-[0_4px_32px_rgba(212,84,122,0.3)] transition-all duration-300">
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

{/* CTA */}
      <ScrollReveal>
        <section className="px-8 pb-28 max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <p className="text-xs font-medium text-[#D4547A] uppercase tracking-widest">Get Started</p>
          </div>
          <div className="relative overflow-hidden bg-[#D4547A] rounded-3xl p-12 text-center">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white blob opacity-10 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
                공모전 참가를 망설이고 있나요?
              </h2>
              <p className="text-white/70 text-sm mb-8 leading-relaxed">
                처음이어도 괜찮아요. AI 멘토가 첫 아이디어부터 마지막 제출까지 함께해요.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-white text-[#D4547A] px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-[#FBF9F6] transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
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
          <BrandMark eager={false} />
          <p className="text-xs text-[#ADA8A0]">© 2026 PlanCraft</p>
        </div>
      </footer>
    </div>
  );
}
