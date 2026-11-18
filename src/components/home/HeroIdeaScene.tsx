"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Pause, PenLine, Play } from "lucide-react";
import styles from "./hero-scene.module.css";

const EXAMPLES = [
  {
    label: "급식", quote: "급식이 왜 이렇게 많이 남을까?",
    title: "함께 바꾸는\n우리 학교 급식",
    problem: "학생들이 음식을 남기는 이유를 알기 어려워요.",
    idea: "잔반 기록과 학생 의견을 모아 식단 개선을 돕는 서비스",
  },
  {
    label: "분실물", quote: "우리 반 분실물, 주인을 찾을 수 없을까?",
    title: "주인을 찾아주는\n우리 반 분실물함",
    problem: "물건을 잃어버려도 어디서 찾아야 할지 몰라요.",
    idea: "발견한 물건의 사진을 올리고, 내 물건을 찾아보는 서비스",
  },
  {
    label: "수업 피드백", quote: "우리 반, 지금 수업을 잘 따라오고 있을까?",
    title: "학생의 이해가 보이는\n수업 피드백 노트",
    problem: "질문하지 않는 학생의 이해도를 파악하기 어려워요.",
    idea: "학생은 이해한 정도를 알리고, 선생님은 필요한 설명을 더하는 서비스",
  },
  {
    label: "학교 공지", quote: "중요한 학교 공지, 놓치지 않을 수 없을까?",
    title: "놓치지 않도록\n학교 소식 한곳에",
    problem: "학교 알림이 흩어져 신청 기한을 놓치곤 해요.",
    idea: "공지를 한곳에 모아 필요한 소식과 신청 기한을 알려주는 서비스",
  },
  {
    label: "학습 계획", quote: "해야 할 공부, 어디서부터 시작해야 할까?",
    title: "오늘 할 일을 찾는\n나만의 학습 계획",
    problem: "해야 할 공부가 많아 무엇부터 할지 정하기 어려워요.",
    idea: "남은 시간과 학습 목표를 바탕으로 오늘의 공부 계획을 정리하는 서비스",
  },
] as const;

const ROTATION_MS = 7000;

/** All text variants share a grid cell so the longest variant reserves its space. */
function ExampleText({ field, selected }: { field: keyof typeof EXAMPLES[number]; selected: number }) {
  return <span className={styles.textSlot}>
    {EXAMPLES.map((item, index) => <span key={item.label} data-active={selected === index} aria-hidden={selected !== index}>{field === "quote" ? "“" + item[field] + "”" : item[field]}</span>)}
  </span>;
}

export default function HeroIdeaScene() {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const noteId = useId();
  const rotating = playing && visible && !hovered && !focused && !reducedMotion;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    function sync() {
      setReducedMotion(media.matches);
      setVisible(inView && !document.hidden);
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      sync();
    }, { threshold: 0.15 });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    media.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setSelected((index) => (index + 1) % EXAMPLES.length), ROTATION_MS);
    return () => window.clearTimeout(timer);
  }, [rotating, selected]);

  return <section ref={ref} className={styles.scene} aria-label="생각이 기획으로 바뀌는 예시" aria-roledescription="캐러셀" data-rotating={rotating}
    onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
    onPointerLeave={() => setHovered(false)}
    onFocusCapture={(event) => setFocused(!event.target.closest("[data-rotation-control]"))}
    onBlurCapture={(event) => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className={styles.examplePicker}>
      <p>이런 생각도, 시작이 될 수 있어요.</p>
      <div role="group" aria-label="아이디어 예시 선택">
        {EXAMPLES.map((item, index) => <button key={item.label} type="button" aria-pressed={selected === index} aria-controls={noteId} onClick={() => setSelected(index)}>{item.label}</button>)}
      </div>
    </div>
    <blockquote className={styles.thought}><ExampleText field="quote" selected={selected} /></blockquote>
    <div className={styles.paperStack}>
      <article id={noteId} className={styles.paper} aria-live={rotating ? "off" : "polite"} aria-atomic="true">
        <p className={styles.paperLabel}><PenLine size={14} aria-hidden="true" /> 내 아이디어 노트 <span>예시</span></p>
        <h2><ExampleText field="title" selected={selected} /></h2>
        <div className={styles.noteLine}><span>이런 불편함에서</span><p><ExampleText field="problem" selected={selected} /></p></div>
        <div className={styles.noteLine}><span>이런 서비스를</span><p><ExampleText field="idea" selected={selected} /></p></div>
      </article>
      <Image className={styles.mentor} src="/ideabot-remove.png" width={78} height={78} alt="" unoptimized />
    </div>
    <p className={styles.caption}>아이디어봇과 이야기하면,<br className={styles.mobileBreak} /> 막연했던 생각이 조금씩 선명해져요.</p>
    <div className={styles.rotationControls}>
      <span aria-hidden="true">{String(selected + 1).padStart(2, "0")} <i>/</i> {String(EXAMPLES.length).padStart(2, "0")}</span>
      <button type="button" data-rotation-control onClick={() => setPlaying((value) => !value)} disabled={reducedMotion} title={reducedMotion ? "동작 줄이기 설정에서는 자동 넘김이 정지됩니다" : undefined}>
        {playing && !reducedMotion ? <Pause size={12} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
        {reducedMotion ? "자동 넘김 꺼짐" : playing ? "자동 넘김 정지" : "자동 넘김 재생"}
      </button>
    </div>
  </section>;
}
