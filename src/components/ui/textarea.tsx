import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-xl border border-[#EBE7E0] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#ADA8A0] focus:outline-none focus:ring-2 focus:ring-[#D4547A]/20 focus:border-[#D4547A]/40 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
