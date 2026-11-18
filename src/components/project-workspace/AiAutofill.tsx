"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle, Wand2 } from "lucide-react";
import styles from "./ai-autofill.module.css";

export function AiAutofillButton({ loading, disabled, onClick, children = "AI 자동채우기" }: { loading: boolean; disabled?: boolean; onClick: () => void; children?: ReactNode }) {
  return <button type="button" className={styles.button} data-autofill disabled={loading || disabled} aria-busy={loading} onClick={onClick}>
    {loading ? <LoaderCircle size={15} className={styles.spinner} aria-hidden="true" /> : <Wand2 size={15} aria-hidden="true" />}
    {loading ? "AI 작성 중" : children}
  </button>;
}

/** Mount only while a request is pending so elapsed time resets for each request. */
export function AiAutofillProgress({ message }: { message: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <section className={styles.progress} aria-label="AI 자동채우기 상태">
    <div className={styles.progressContent}>
      <span className={styles.progressIcon}><LoaderCircle size={21} className={styles.spinner} aria-hidden="true" /></span>
      <div className={styles.message} role="status"><strong>{message}</strong><p>완성되면 작성 영역에 반영돼요. 잠시만 기다려주세요.</p></div>
      <span className={styles.elapsed} aria-hidden="true">{seconds}초 경과</span>
    </div>
    <div className={styles.track} role="progressbar" aria-label="AI가 내용을 작성하고 있습니다"><span /></div>
  </section>;
}
