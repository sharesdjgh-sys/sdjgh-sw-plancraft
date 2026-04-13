import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STEPS = [
  { id: 1, label: "아이디어 발굴", icon: "💡", route: "idea" },
  { id: 2, label: "문제 정의", icon: "🎯", route: "story" },
  { id: 3, label: "이해관계자 분석", icon: "👥", route: "characters" },
  { id: 4, label: "기능 설계", icon: "⚙️", route: "episodes" },
  { id: 5, label: "기획서 작성", icon: "📝", route: "script" },
  { id: 6, label: "최종 검토", icon: "✅", route: "submit" },
];

export const GENRES = [
  "교육", "환경·에너지", "의료·건강", "사회복지", "교통·이동",
  "안전·재난", "문화·예술", "농업·식품", "스포츠", "지역사회", "기타"
];
