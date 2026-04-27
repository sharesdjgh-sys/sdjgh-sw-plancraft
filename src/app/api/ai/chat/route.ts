import { NextRequest, NextResponse } from "next/server";
import { chat, Message } from "@/lib/claude";
import { PROMPTS, type PromptStep } from "@/lib/prompts";
import { type UserType } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const { messages, step, userType } = await req.json() as {
    messages: Message[];
    step: PromptStep;
    userType?: UserType;
  };

  const type: UserType = userType === "general" ? "general" : "student";
  const systemPrompt = PROMPTS[type][step] ?? PROMPTS.student.idea;

  try {
    const reply = await chat(messages, systemPrompt);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI 응답 실패" }, { status: 500 });
  }
}
