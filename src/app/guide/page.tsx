"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import FullscreenToggle from "@/components/FullscreenToggle";
import WorkspaceSidebar from "@/components/project-workspace/WorkspaceSidebar";
import { useSearchParams } from "next/navigation";
import { useProjects } from "@/lib/use-project";
import type { UserType } from "@/lib/storage";
import { ArrowLeft, ArrowRight, Check, Clock3, Lightbulb, Target, Users, Cpu, PenLine, Trophy, MoveHorizontal } from "lucide-react";
import base from "@/app/project/[id]/idea/idea.module.css";
import styles from "./guide.module.css";

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


const GENERAL_GUIDE_COPY: Partial<Record<number, { desc?: string; tips?: string[] }>> = {
  1: { tips: ["생활·업무·취미에서 반복되는 불편함을 찾아봐요", "직접 겪은 상황과 그때 어려웠던 점을 이야기해요", "누구에게 어떤 도움이 필요한 서비스인지 생각해봐요", "아이디어봇과 대화하며 만들고 싶은 것을 구체화해요"] },
  4: { tips: ["핵심 기능 3~5가지를 명확하게 정리해봐요", "각 기능의 입력·처리·출력 흐름을 구체화해봐요", "바이브코딩으로 직접 구현 가능한 기술과 범위를 선택해요", "기능이 너무 복잡하면 핵심에 집중해서 줄여봐요"] },
  5: { desc: "직접 만들 서비스의 기준이 될 기획서를 완성하는 단계예요." },
  6: { desc: "기획서를 점검하고 공유하거나 직접 개발할 준비를 하는 단계예요.", tips: ["기획서 전체 흐름을 처음부터 끝까지 다시 읽어봐요", "문제 정의, 기능, 기대 효과의 일관성을 확인해요", "공유할 대상과 문서 형식을 확인해요", "먼저 만들 기능과 다음 실행 계획을 정리해요"] },
};
const GENERAL_GUIDE_STEPS = GUIDE_STEPS.map((step) => ({ ...step, ...GENERAL_GUIDE_COPY[step.step] }));

const OUTCOMES = [
  { title: "해결하고 싶은 문제와 아이디어 한 줄", example: "학교 공지와 신청 일정을 한곳에서 확인하는 알림 서비스를 만들고 싶어요." },
  { title: "문제의 배경과 SW로 해결할 방법", example: "공지가 여러 채널에 흩어져 신청을 놓쳐요. 공지를 모아 일정별로 알려주면 좋겠어요." },
  { title: "주요 사용자와 각자의 필요", example: "학부모는 필요한 공지만 빠르게, 선생님은 전달 여부를 쉽게 확인하고 싶어요." },
  { title: "핵심 기능과 입력·처리·출력 흐름", example: "공지 등록 → 날짜와 대상 분류 → 해당 사용자에게 일정 알림 보내기" },
  { title: "문제부터 기대 효과까지 이어지는 기획서", example: "문제의 배경, 사용 대상, 핵심 기능, 구현 방법과 기대 효과를 하나의 흐름으로 정리해요." },
  { title: "점검을 마친 최종 기획서", example: "빠진 내용과 어색한 문장을 확인하고, 제출 형식과 파일까지 마지막으로 점검해요." },
];

function GuideContent() {
  const searchParams = useSearchParams();
  const userType: UserType = searchParams.get("type") === "general" ? "general" : "student";
  const guideSteps = userType === "general" ? GENERAL_GUIDE_STEPS : GUIDE_STEPS;
  const dashboardHref = "/dashboard?type=" + userType;
  const projects = useProjects();
  const railRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLOListElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  const goTo = useCallback((index: number) => {
    const rail = railRef.current;
    if (!rail || rail.clientWidth === 0 || !Number.isFinite(index)) return;
    const next = Math.max(0, Math.min(guideSteps.length - 1, index));
    rail.scrollTo({
      left: next * rail.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [guideSteps]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let lastWheel = -Infinity;
    // Convert a vertical mouse wheel only within the guide; release at either end.
    function onWheel(event: WheelEvent) {
      if (!rail || event.ctrlKey || event.shiftKey || event.altKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY) || Math.abs(event.deltaY) < 4) return;
      const direction = event.deltaY > 0 ? 1 : -1;
      const atEdge = direction < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
      if (atEdge) return;
      event.preventDefault();
      if (performance.now() - lastWheel < 650) return;
      lastWheel = performance.now();
      goTo(Math.round(rail.scrollLeft / rail.clientWidth) + direction);
    }
    rail.addEventListener("wheel", onWheel, { passive: false });
    let previousWidth = rail.clientWidth;
    const observer = new ResizeObserver(() => {
      if (rail.clientWidth === 0 || rail.clientWidth === previousWidth) return;
      previousWidth = rail.clientWidth;
      rail.scrollTo({ left: activeRef.current * previousWidth, behavior: "instant" });
    });
    observer.observe(rail);
    return () => { rail.removeEventListener("wheel", onWheel); observer.disconnect(); };
  }, [goTo]);

  useEffect(() => {
    const nav = navRef.current;
    const item = nav?.children[active] as HTMLElement | undefined;
    if (nav && item) nav.scrollTo({
      left: item.offsetLeft - nav.offsetLeft - (nav.clientWidth - item.clientWidth) / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [active]);

  return (
    <div className={base.page + " " + base.workspacePage}>
      <header className={base.header + " " + styles.header}>
        <Link href="/" className={base.brand}>
          <BrandMark />
        </Link>
        <span className={base.mobileStage}>사용 가이드</span>
      </header>

      <div className={base.layout + " " + base.journeyLayout}>
        <WorkspaceSidebar userType={userType} active="guide" projectCount={projects?.length ?? 0} />
        <main className={base.main + " " + styles.main}>
        <section className={base.heading + " " + styles.intro} aria-labelledby="guide-title">
          <div>
            <p className={base.eyebrow}>나의 작업 공간 · 아이디어를 기획으로</p>
            <h1 id="guide-title">사용 가이드</h1>
            <p className={base.description}>아이디어 발굴부터 최종 검토까지, 단계별 작성 방법을 살펴보세요.</p>
          </div>
          <div className={base.headingActions}>
            <Link href={dashboardHref} className={base.helpButton}>내 프로젝트 <ArrowRight size={15} /></Link>
            <FullscreenToggle />
          </div>
        </section>

        <section className={styles.reader} aria-label="6단계 기획 가이드">
          <div className={styles.readerHeading}>
            <p>생각에서 완성까지 <span>THE PLANNING JOURNEY</span></p>
            <span className={styles.scrollHint}><MoveHorizontal size={15} /><span className={styles.desktopHint}>휠로 옆으로 넘겨보세요</span><span className={styles.mobileHint}>옆으로 밀어보세요</span></span>
          </div>
          <nav aria-label="가이드 단계 선택">
            <ol className={styles.chapterNav} ref={navRef}>
              {guideSteps.map((step, index) => (
                <li key={step.step}>
                  <button aria-current={active === index ? "step" : undefined} aria-controls={"guide-step-" + step.step} onClick={() => goTo(index)}>
                    <span>{String(step.step).padStart(2, "0")}</span>{step.title}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <p className={styles.srOnly} id="guide-keyboard">좌우 방향키로 이전·다음 단계를, Home과 End 키로 처음·마지막 단계를 볼 수 있습니다.</p>
          <div className={styles.rail} ref={railRef} role="region" aria-roledescription="슬라이드" aria-label="단계별 상세 가이드" aria-describedby="guide-keyboard" tabIndex={0}
            onScroll={() => {
              const rail = railRef.current;
              if (!rail || rail.clientWidth === 0) return;
              const index = Math.max(0, Math.min(guideSteps.length - 1, Math.round(rail.scrollLeft / rail.clientWidth)));
              activeRef.current = index;
              setActive(index);
            }}
            onKeyDown={(event) => {
              const next = event.key === "ArrowRight" ? active + 1 : event.key === "ArrowLeft" ? active - 1 : event.key === "Home" ? 0 : event.key === "End" ? guideSteps.length - 1 : null;
              if (next !== null) { event.preventDefault(); goTo(next); }
            }}
          >
            {guideSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.step} id={"guide-step-" + step.step} className={styles.chapter} aria-labelledby={"guide-heading-" + step.step} aria-hidden={active !== index} inert={active !== index}>
                  <div className={styles.overview}>
                    <div className={styles.chapterMark}><span aria-hidden="true">{String(step.step).padStart(2, "0")}</span><Icon size={30} strokeWidth={1.35} aria-hidden="true" /></div>
                    <div className={styles.chapterLabel}>STEP {String(step.step).padStart(2, "0")} <span><Clock3 size={12} /> 예상 {step.time}</span></div>
                    <h2 id={"guide-heading-" + step.step}>{step.title}</h2>
                    <p>{step.desc}</p>
                    <span className={styles.chapterSubtitle}>{index === 0 ? "거창한 아이디어보다, 가까운 불편함부터." : index === 1 ? "무엇을 만들지보다, 왜 필요한지부터." : index === 2 ? "만드는 사람의 생각에서, 쓰는 사람의 입장으로." : index === 3 ? "할 수 있는 모든 것보다, 꼭 필요한 기능부터." : index === 4 ? "흩어진 생각을, 하나의 설득력 있는 이야기로." : "마지막 점검이, 기획의 완성도를 높여줘요."}</span>
                  </div>
                  <div className={styles.detail}>
                    <h3>이렇게 해보세요 <span>작은 질문부터 차근차근</span></h3>
                    <ol className={styles.tips}>
                      {step.tips.map((tip, tipIndex) => <li key={tip}><span>{String(tipIndex + 1).padStart(2, "0")}</span><p>{tip}</p><Check size={14} strokeWidth={1.5} aria-hidden="true" /></li>)}
                    </ol>
                    <div className={styles.outcome}><p className={styles.outcomeLabel}>이 단계에서 남길 것</p><h3>{OUTCOMES[index].title}</h3><p className={styles.example}><span>예를 들면</span>{OUTCOMES[index].example}</p></div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className={styles.readerFooter}>
            <div className={styles.position} role="status" aria-live="polite" aria-atomic="true"><span>{String(active + 1).padStart(2, "0")}</span><span>/ 06</span><p>{guideSteps[active].title}</p></div>
            <div className={styles.progress} aria-hidden="true">{guideSteps.map((step, index) => <span key={step.step} className={index <= active ? styles.reached : undefined} />)}</div>
            <div className={styles.controls}>
              <button onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="이전 단계"><ArrowLeft size={18} /></button>
              <button onClick={() => goTo(active + 1)} disabled={active === guideSteps.length - 1} aria-label="다음 단계"><ArrowRight size={18} /></button>
            </div>
          </div>
        </section>

        <section className={styles.start}>
          <div><p className={base.eyebrow}>{active === 5 ? "이제, 나의 기획을 시작할 시간" : "읽는 것에서, 만드는 것으로"}</p><h2>작은 생각 하나면 시작할 수 있어요.</h2><p>완벽한 아이디어가 없어도 괜찮아요. 첫 질문부터 함께 정리해봐요.</p></div>
          <Link href={dashboardHref} className={base.primary}>내 아이디어 기획하기 <ArrowRight size={16} /></Link>
        </section>
        <footer className={styles.footer}><span>PlanCraft · 생각에서 기획까지</span><span>YOUR IDEA, ONE STEP CLOSER.</span></footer>
      </main>
      </div>
    </div>
  );
}

export default function GuidePage() {
  return <Suspense fallback={<main className={base.status} role="status">사용 가이드를 준비하고 있어요.</main>}><GuideContent /></Suspense>;
}
