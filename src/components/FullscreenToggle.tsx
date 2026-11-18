"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import styles from "./fullscreen-toggle.module.css";

export default function FullscreenToggle() {
  const [supported, setSupported] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    function sync() {
      setSupported(Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen));
      setFullscreen(Boolean(document.fullscreenElement));
      setError("");
    }
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => {
      mounted.current = false;
      document.removeEventListener("fullscreenchange", sync);
    };
  }, []);

  async function toggle() {
    if (!supported || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      if (mounted.current) setError("전체 화면으로 전환하지 못했어요. 브라우저 설정을 확인해주세요.");
    } finally {
      pendingRef.current = false;
      if (mounted.current) setPending(false);
    }
  }

  const label = fullscreen ? "전체 화면 종료" : "전체 화면 보기";
  return (
    <span className={styles.control}>
      <button
        type="button"
        className={styles.button}
        onClick={() => void toggle()}
        disabled={!supported || pending}
        aria-label={label}
        aria-pressed={fullscreen}
        aria-busy={pending}
        title={!supported ? "이 브라우저에서는 전체 화면을 지원하지 않습니다" : fullscreen ? "전체 화면 종료 (Esc)" : label}
      >
        {fullscreen ? <Minimize2 size={17} strokeWidth={1.7} aria-hidden="true" /> : <Maximize2 size={17} strokeWidth={1.7} aria-hidden="true" />}
      </button>
      {error && <span className={styles.error} role="alert">{error}</span>}
    </span>
  );
}
