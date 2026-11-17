import Image from "next/image";
import styles from "./brand.module.css";

/** The approved M1 wordmark, paired with the original PlanCraft icon. */
export default function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`${styles.lockup}${compact ? ` ${styles.compact}` : ""}`} data-brand="plancraft-m1">
      <Image
        className={styles.icon}
        src="/plancraft-logo-remove.png"
        width={compact ? 30 : 40}
        height={compact ? 30 : 40}
        alt=""
        unoptimized
      />
      <Image
        className={styles.wordmark}
        src="/brand/plancraft-wordmark-m1.png"
        width={2172}
        height={724}
        sizes={compact ? "116px" : "(max-width: 760px) 124px, 154px"}
        loading={compact ? "lazy" : "eager"}
        alt="PlanCraft"
      />
    </span>
  );
}
