import Image from "next/image";
import styles from "./brand.module.css";

/** The approved M1 wordmark, paired with the original PlanCraft icon. */
export default function BrandMark({ eager = true }: { eager?: boolean }) {
  return (
    <span className={styles.lockup} data-brand="plancraft-m1">
      <Image
        className={styles.icon}
        src="/plancraft-logo-remove.png"
        width={40}
        height={40}
        alt=""
        loading={eager ? "eager" : "lazy"}
        unoptimized
      />
      <Image
        className={styles.wordmark}
        src="/brand/plancraft-wordmark-m1.png"
        width={2172}
        height={724}
        sizes="(max-width: 760px) 124px, 154px"
        loading={eager ? "eager" : "lazy"}
        alt="PlanCraft"
      />
    </span>
  );
}
