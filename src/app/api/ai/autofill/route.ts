import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/claude";

type ChatMessage = { role: "user" | "assistant"; content: string };

function buildTranscript(messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.role !== "assistant" || !m.content.startsWith("안녕하세요"))
    .map((m) => `[${m.role === "user" ? "사용자" : "AI"}]: ${m.content}`)
    .join("\n");
}

const AUTOFILL_PROMPTS: Record<string, string> = {
  story: `당신은 SW 공모전 기획서 작성 도우미입니다.
아래 아이디어 발굴 대화 내용을 분석하여 문제 정의 단계에 필요한 정보를 JSON으로 반환하세요.

반드시 아래 JSON 형식만 반환하고 다른 텍스트는 절대 포함하지 마세요:
{
  "logline": "SW 아이디어를 한 문장으로 (예: ~를 해결하는 SW)",
  "theme": "해결하려는 문제 (2~4문장, 왜 이 문제가 중요한지)",
  "setting": "배경 및 필요성 (2~4문장, 문제가 발생하는 환경과 필요성)",
  "plotOutline": "기능 개요 (문제 인식, 해결 방식, 주요 기능, 기대 효과를 포함한 200자 이상)",
  "totalEpisodes": "핵심 기능 수 (숫자만, 예: 3)"
}`,

  character: `당신은 SW 공모전 기획서 작성 도우미입니다.
아래 아이디어 발굴 대화 내용을 분석하여 이해관계자 분석에 필요한 정보를 JSON으로 반환하세요.

반드시 아래 JSON 형식만 반환하고 다른 텍스트는 절대 포함하지 마세요:
{
  "characters": [
    {
      "name": "이해관계자 이름 (예: 고등학생, 학교 선생님)",
      "role": "역할 (주요 사용자 | 보조 사용자 | 운영자 | 이해관계자 | 기타 중 하나)",
      "age": "연령/특성 (예: 15~17세)",
      "appearance": "현재 불편함 (2~3문장)",
      "personality": "SW 사용 목적 (2~3문장)",
      "backstory": "SW와의 관계 (1~2문장)"
    }
  ]
}
이해관계자는 최소 1명, 최대 4명까지 포함하세요.`,

  episodes: `당신은 SW 공모전 기획서 작성 도우미입니다.
아래 아이디어 발굴 대화 내용을 분석하여 핵심 기능 설계에 필요한 정보를 JSON으로 반환하세요.

반드시 아래 JSON 형식만 반환하고 다른 텍스트는 절대 포함하지 마세요:
{
  "episodes": [
    {
      "title": "기능 이름 (간결하게)",
      "synopsis": "기능 설명 (이 기능이 무엇을 하는지, 어떻게 작동하는지 2~3문장)"
    }
  ]
}
핵심 기능은 최소 2개, 최대 6개까지 포함하세요.`,

  script: `당신은 SW 공모전 기획서 작성 도우미입니다.
아래 아이디어 발굴 대화 내용을 분석하여 기획서 초안을 작성해주세요.

반드시 아래 JSON 형식만 반환하고 다른 텍스트는 절대 포함하지 마세요:
{
  "script": "기획서 내용 전문 (아래 형식으로 작성):\\n\\n[배경 및 필요성]\\n내용...\\n\\n[해결 방안]\\n내용...\\n\\n[주요 기능]\\n내용...\\n\\n[기대 효과]\\n내용..."
}`,
};

export async function POST(req: NextRequest) {
  const { ideaChat, step } = await req.json() as { ideaChat: ChatMessage[]; step: string };

  if (!ideaChat || ideaChat.length === 0) {
    return NextResponse.json({ error: "아이디어 발굴 대화 내용이 없습니다." }, { status: 400 });
  }

  const systemPrompt = AUTOFILL_PROMPTS[step];
  if (!systemPrompt) {
    return NextResponse.json({ error: "지원하지 않는 단계입니다." }, { status: 400 });
  }

  const transcript = buildTranscript(ideaChat);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `아이디어 발굴 대화 내용:\n\n${transcript}\n\n위 내용을 바탕으로 JSON을 생성해주세요.`,
        },
      ],
    });

    const raw = response.content[0];
    if (raw.type !== "text") throw new Error("Unexpected response type");

    // Extract JSON from the response (handle potential markdown code blocks)
    const jsonMatch = raw.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI 자동채우기 실패" }, { status: 500 });
  }
}
