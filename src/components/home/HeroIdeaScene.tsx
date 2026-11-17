"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { PenLine } from "lucide-react";
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
];

export default function HeroIdeaScene() {
  const [selected, setSelected] = useState(0);
  const noteId = useId();
  const example = EXAMPLES[selected];

  return <section className={styles.scene} aria-label="생각이 기획으로 바뀌는 예시">
    <div className={styles.examplePicker}>
      <p>이런 생각도, 시작이 될 수 있어요.</p>
      <div role="group" aria-label="아이디어 예시 선택">
        {EXAMPLES.map((item, index) => <button key={item.label} type="button" aria-pressed={selected === index} aria-controls={noteId} onClick={() => setSelected(index)}>{item.label}</button>)}
      </div>
    </div>
    <blockquote className={styles.thought}>“{example.quote}”</blockquote>
    <div className={styles.paperStack}>
      <article id={noteId} className={styles.paper} aria-live="polite" aria-atomic="true">
        <p className={styles.paperLabel}><PenLine size={14} aria-hidden="true" /> 내 아이디어 노트 <span>예시</span></p>
        <h2>{example.title}</h2>
        <div className={styles.noteLine}><span>이런 불편함에서</span><p>{example.problem}</p></div>
        <div className={styles.noteLine}><span>이런 서비스를</span><p>{example.idea}</p></div>
      </article>
      <Image className={styles.mentor} src="/ideabot-remove.png" width={78} height={78} alt="" unoptimized />
    </div>
    <p className={styles.caption}>아이디어봇과 이야기하면,<br className={styles.mobileBreak} /> 막연했던 생각이 조금씩 선명해져요.</p>
  </section>;
}
