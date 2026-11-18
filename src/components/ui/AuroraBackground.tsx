"use client";

import { useEffect, useRef } from "react";
import styles from "./aurora-background.module.css";

/** Place inside a positioned, isolated section; the fixed canvas stays behind its content. */
export default function AuroraBackground({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Browsers without IntersectionObserver get a static background.
    if (typeof IntersectionObserver === "undefined") {
      element.dataset.visible = "true";
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    function sync() {
      if (!element) return;
      const visible = inView && !document.hidden;
      element.dataset.visible = String(visible);
      element.dataset.running = String(visible && !reducedMotion.matches);
    }
    // Observe the section-sized anchor, rather than the viewport-fixed canvas.
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      sync();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
    };
  }, []);

  return <div ref={ref} className={styles.root + " " + className} data-aurora data-visible="false" data-running="false" aria-hidden="true">
    <div className={styles.canvas}>
      <span className={styles.orb + " " + styles.rose} />
      <span className={styles.orb + " " + styles.lavender} />
      <span className={styles.orb + " " + styles.teal} />
    </div>
  </div>;
}
