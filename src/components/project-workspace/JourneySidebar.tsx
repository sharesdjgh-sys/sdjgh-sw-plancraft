"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Check, LockKeyhole } from "lucide-react";
import JourneySignature from "@/components/brand/JourneySignature";
import BrandMark from "@/components/brand/BrandMark";
import { getProjectProgress } from "@/lib/project-status";
import type { Project } from "@/lib/storage";
import { STEPS } from "@/lib/utils";
import styles from "./journey-sidebar.module.css";

const DESCRIPTIONS = [
  "불편함에서 아이디어 찾기",
  "해결할 문제와 필요성 정리",
  "사용자의 입장에서 살펴보기",
  "핵심 기능과 동작 구체화",
  "생각을 하나의 기획서로",
  "내용을 점검하고 마무리",
];

type Props = {
  project: Project;
  step: number;
  onNavigate?: (href: string) => void;
};

export default function JourneySidebar({ project, step, onNavigate }: Props) {
  const navRef = useRef<HTMLOListElement>(null);
  const progress = getProjectProgress(project);
  const dashboardHref = project.userType === "general" ? "/dashboard?type=general" : "/dashboard?type=student";

  useEffect(() => {
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    const nav = navRef.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="step"]');
    if (nav && current) nav.scrollLeft = current.offsetLeft - nav.offsetLeft - 16;
  }, [step]);

  return (
    <aside className={styles.sidebar} aria-label="나의 기획 여정">
      <Link className={styles.sidebarBrand} href={dashboardHref} aria-label="PlanCraft 프로젝트 목록으로" onClick={onNavigate ? (event) => { event.preventDefault(); onNavigate(dashboardHref); } : undefined}>
        <BrandMark />
      </Link>
      <div className={styles.overview}>
        <p className={styles.projectLabel}>{project.isCompleted ? "완료한 프로젝트" : "진행 중인 프로젝트"}</p>
        <p className={styles.projectTitle} title={project.title}>{project.title}</p>
        <div className={styles.progressLabel}>
          <span>{project.isCompleted ? "기획 완료" : "기획 진행률"}</span>
          <strong>{progress}<span>%</span></strong>
        </div>
        <div className={styles.progressTrack} role="progressbar" aria-label="기획 진행률" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <nav className={styles.navigation} aria-label="기획 단계">
        <div className={styles.navHeading}>
          <h2>나의 기획 여정</h2>
          <span>{String(step).padStart(2, "0")} <span>/ 06</span></span>
        </div>
        <ol ref={navRef} className={styles.steps}>
          {STEPS.map((item) => {
            const selected = item.id === step;
            const available = item.id <= project.currentStep || project.isCompleted;
            const passed = !selected && (item.id < project.currentStep || project.isCompleted);
            const href = `/project/${encodeURIComponent(project.id)}/${item.route}`;
            const className = `${styles.step} ${selected ? styles.current : !available ? styles.locked : passed ? styles.passed : ""}`;
            const content = <>
              <span className={styles.stepNumber} aria-hidden="true">{String(item.id).padStart(2, "0")}</span>
              <span className={styles.stepCopy}>
                <span className={styles.stepName}>{item.label}</span>
                <span className={styles.stepDescription}>{DESCRIPTIONS[item.id - 1]}</span>
              </span>
              <span className={styles.stepIndicator} aria-hidden="true">{!available ? <LockKeyhole size={13} strokeWidth={1.5} /> : passed ? <Check size={14} strokeWidth={1.5} /> : null}</span>
            </>;
            return <li key={item.id}>
              {available ? <Link href={href} className={className} aria-current={selected ? "step" : undefined} onClick={onNavigate ? (event) => { event.preventDefault(); onNavigate(href); } : undefined}>{content}</Link>
                : <span className={className} aria-disabled="true" aria-label={`${item.label} · 이전 단계 진행 후 열립니다`}>{content}</span>}
            </li>;
          })}
        </ol>
      </nav>

      <div className={styles.bottom}>
        <div className={styles.signature}><JourneySignature /></div>
      </div>
    </aside>
  );
}
