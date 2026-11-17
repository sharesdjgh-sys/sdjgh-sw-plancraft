import { NextRequest, NextResponse } from "next/server";
import { chat, type Message } from "@/lib/claude";
import { PROMPTS, type PromptStep } from "@/lib/prompts";
import type { UserType } from "@/lib/storage";

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "올바른 JSON 요청이 필요해요." }, { status: 400 }); }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "대화 내용을 확인해주세요." }, { status: 400 });
  const { messages, step, userType, ideaFocus } = body as { messages?: unknown; step?: unknown; userType?: unknown; ideaFocus?: unknown };
  if (ideaFocus !== undefined && ideaFocus !== "problem" && ideaFocus !== "context" && ideaFocus !== "summary") return NextResponse.json({ error: "아이디어 안내 위치를 확인해주세요." }, { status: 400 });
  if (typeof step !== "string" || !Object.hasOwn(PROMPTS.student, step)
    || !Array.isArray(messages) || messages.length === 0 || messages.length > 200
    || !messages.every((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim() && m.content.length <= 20000)
    || messages.reduce((total, m) => total + m.content.length, 0) > 100000) {
    return NextResponse.json({ error: "대화 내용이나 기획 단계를 확인해주세요. 대화가 너무 길면 새 대화로 나눠주세요." }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI 연결이 설정되지 않았어요. 관리자에게 연결 설정을 요청해주세요." }, { status: 503 });
  }
  const type: UserType = userType === "general" ? "general" : "student";
  try {
    const focusPrompts = {
      problem: "현재 사용자는 불편함을 발견하는 중입니다. 경험한 불편함 하나를 편하게 말하도록 도와주세요. 아직 아이디어가 없으면 일상에서 고를 수 있는 선택지 3개를 제안하세요.",
      context: "현재 사용자는 대상과 상황을 구체화하는 중입니다. 대화에서 이미 나온 내용은 반복해서 묻지 말고, 누가 언제 어떤 어려움을 겪는지 한 번에 한 질문으로 좁혀주세요.",
      summary: "현재 사용자는 아이디어를 한 문장으로 정리하려 합니다. 대화에 나온 근거만 바탕으로 누구의 어떤 불편함을 해결하는 서비스인지 짧은 문장을 제안하고, 사용자가 직접 다듬도록 도와주세요. 새로운 사실이나 기능을 지어내지 마세요.",
    };
    const system = PROMPTS[type][step as PromptStep] + (step === "idea" && ideaFocus ? "\n\n" + focusPrompts[ideaFocus] : "");
    const reply = await chat(messages as Message[], system);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI chat request failed", err);
    return NextResponse.json({ error: "AI 응답을 받지 못했어요. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }
}
