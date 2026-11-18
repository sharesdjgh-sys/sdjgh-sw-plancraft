import Image from "next/image";
import styles from "./brand.module.css";

export default function JourneySignature({ variant = "sidebar" }: { variant?: "sidebar" | "footer" }) {
  if (variant === "footer") return (
    <Image
      className={styles.footerSignature}
      src="/brand/life-professor-logo.png"
      width={399}
      height={67}
      alt="인생교수의 AI 연구소"
      unoptimized
    />
  );

  return (
    <span className={styles.journeySignature}>
      <span className={styles.signatureMark} aria-hidden="true" />
      <span className={styles.signatureWordmark}>
        <Image
          className={styles.signatureSource}
          src="/brand/life-professor-logo.png"
          width={399}
          height={67}
          alt="인생교수의 AI 연구소"
          unoptimized
        />
      </span>
    </span>
  );
}
