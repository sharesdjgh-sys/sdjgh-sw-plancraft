"use client";

import Link from "next/link";
import { STEPS } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  projectId?: string;
}

export default function StepIndicator({ currentStep, projectId }: StepIndicatorProps) {
  const progress = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-[#ADA8A0] uppercase tracking-wider">진행률</span>
        <span className="text-xs font-bold text-[#C06070]">{progress}%</span>
      </div>
      <div className="w-full bg-[#F4F1EC] rounded-full h-1.5 mb-5">
        <div
          className="bg-[#C06070] h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-1">
        {STEPS.map((step) => {
          const isDone = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = (isDone || isCurrent) && !!projectId;
          const href = `/project/${projectId}/${step.route}`;

          const inner = (
            <div
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-200 ${
                isCurrent ? "bg-[#C06070]/8 border border-[#C06070]/20" : ""
              } ${isClickable ? "hover:bg-[#F4F1EC] cursor-pointer" : "cursor-default"}`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-200 ${
                isDone
                  ? "bg-[#C06070] border-[#C06070]"
                  : isCurrent
                  ? "bg-white border-[#C06070]"
                  : "border-[#EBE7E0] bg-transparent"
              }`}>
                {isDone && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[#C06070]" />}
              </div>
              <span className={`text-xs font-medium transition-colors duration-200 ${
                isDone ? "text-[#ADA8A0]" : isCurrent ? "text-[#C06070]" : "text-[#D4CFC9]"
              }`}>
                {step.label}
              </span>
              {isCurrent && (
                <span className="ml-auto text-[9px] text-[#C06070] font-semibold">진행중</span>
              )}
            </div>
          );

          return isClickable ? (
            <Link key={step.id} href={href}>{inner}</Link>
          ) : (
            <div key={step.id}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
