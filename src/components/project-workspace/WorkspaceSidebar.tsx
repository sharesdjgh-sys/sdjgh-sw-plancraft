"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, LayoutGrid } from "lucide-react";
import BrandMark from "@/components/brand/BrandMark";
import JourneySignature from "@/components/brand/JourneySignature";
import type { UserType } from "@/lib/storage";
import journey from "./journey-sidebar.module.css";
import styles from "./workspace-sidebar.module.css";

type Props = {
  userType: UserType;
  active: "projects" | "guide";
  projectCount: number;
  footer?: ReactNode;
};

export default function WorkspaceSidebar({ userType, active, projectCount, footer }: Props) {
  const query = `?type=${userType}`;
  return (
    <aside className={journey.sidebar + " " + styles.sidebar} aria-label="작업 공간">
      <Link href="/" className={journey.sidebarBrand} aria-label="PlanCraft 홈으로"><BrandMark /></Link>
      <div className={journey.overview}>
        <p className={journey.projectLabel}>{userType === "general" ? "선생님·일반 사용자 모드" : "학생 모드"}</p>
        <p className={journey.projectTitle}>나의 작업 공간</p>
      </div>
      <nav className={journey.navigation} aria-label="작업 공간 메뉴">
        <div className={journey.navHeading}><h2>프로젝트 관리</h2></div>
        <ul className={journey.steps}>
          <li><Link href={"/dashboard" + query} className={journey.step + (active === "projects" ? " " + journey.current : "")} aria-current={active === "projects" ? "page" : undefined}>
            <span className={styles.menuIcon}><LayoutGrid size={17} aria-hidden="true" /></span>
            <span className={journey.stepCopy}><span className={journey.stepName}>프로젝트</span><span className={journey.stepDescription}>아이디어를 모으고 이어서 작성해요</span></span>
            <span className={styles.navCount}>{projectCount}</span>
          </Link></li>
          <li><Link href={"/guide" + query} className={journey.step + (active === "guide" ? " " + journey.current : "")} aria-current={active === "guide" ? "page" : undefined}>
            <span className={styles.menuIcon}><BookOpen size={17} aria-hidden="true" /></span>
            <span className={journey.stepCopy}><span className={journey.stepName}>사용 가이드</span><span className={journey.stepDescription}>6단계 기획 흐름을 살펴봐요</span></span>
          </Link></li>
        </ul>
      </nav>
      {footer ?? <div className={styles.footer}><div className={styles.signature}><JourneySignature /></div></div>}
    </aside>
  );
}
