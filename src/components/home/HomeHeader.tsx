"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./home-header.module.css";

export default function HomeHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let scrolled = false;
    function sync() {
      const next = window.scrollY > 16;
      if (element && next !== scrolled) {
        scrolled = next;
        element.dataset.scrolled = String(next);
      }
    }
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return <nav ref={ref} className={styles.header + " " + className} data-scrolled="false" aria-label="주 메뉴">{children}</nav>;
}
