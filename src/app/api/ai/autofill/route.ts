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

사용자가 이미 작성한 내용이 있을 경우:
- 비어있는 필드("" 또는 없는 필드)는 새로 작성해주세요.
- 이미 내용이 있는 필드는 기존 내용과 겹치지 않는 보완 내용만 작성해주세요 (기존 내용에 이어 붙일 추가 내용).
- logline은 한 문장이므로 이미 있으면 null을 반환하세요.
- totalEpisodes는 이미 값이 있으면 null을 반환하세요.

반드시 아래 JSON 형식만 반환하고 다른 텍스트는 절대 포함하지 마세요:
{
  "logline": "SW 아이디어를 한 문장으로 (예: ~를 해결하는 SW) 또는 null",
  "theme": "해결하려는 문제 내용 또는 null",
  "setting": "배경 및 필요성 내용 또는 null",
  "plotOutline": "기능 개요 내용 또는 null",
  "totalEpisodes": "핵심 기능 수 (숫자만, 예: 3) 또는 null"
}`,

  character: `당신은 SW 공모전 기획서 작성 도우미입니다.
아래 아이디어 발굴 대화 내용을 분석하여 이해관계자 분석에 필요한 정보를 JSON으로 반환하세요.

사용자가 이미 추가한 이해관계자 목록이 제공될 수 있습니다.
이미 있는 이해관계자와 중복되지 않는 새로운 이해관계자만 제안해주세요.
기존 이해관계자가 4명 이상이면 빈 배열을 반환하세요.

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
이미 있는 이해관계자 포함 총 4명을 넘지 않도록 새 이해관계자 수를 조절하세요.`,

  episodes: `당신은 SW 공모전 기획서 작성 도우미입니다.
아래 아이디어 발굴 대화 내용을 분석하여 핵심 기능 설계에 필요한 정보를 JSON으로 반환하세요.

사용자가 이미 작성한 기능 목록이 제공될 수 있습니다.
- 이미 제목(title)이 있는 기능은 null로 반환하세요 (보존).
- 제목이 비어있는 기능 슬롯은 새로 채워주세요.
- 기존 기능과 중복되지 않는 새 기능을 추가 제안할 수 있습니다.

반드시 아래 JSON 형식만 반환하고 다른 텍스트는 절대 포함하지 마세요:
{
  "episodes": [
    {
      "title": "기능 이름 또는 null (이미 있는 경우)",
      "synopsis": "기능 설명 또는 null (이미 있는 경우)"
    }
  ]
}
기존 슬롯 수에 맞추고, 필요하면 새 기능을 끝에 추가하세요 (최대 6개 총합).`,

  cuts: `당신은 SW 공모전 기획서 작성 도우미입니다.
학생들이 앱/웹 개발 경험이 없어도 이해할 수 있도록, 주어진 기능의 처리 단계를 쉽고 구체적으로 설계해주세요.

처리 유형(angle)은 반드시 아래 7가지 중 하나만 사용하세요:
- 사용자 입력: 사용자가 무언가를 입력하거나 선택하는 단계
- 시스템 처리: 앱/서버가 데이터를 계산하거나 AI가 분석하는 단계
- 데이터 조회: 데이터베이스나 외부 API에서 정보를 가져오는 단계
- 결과 출력: 처리 결과를 화면에 보여주는 단계
- 알림 발송: 푸시 알림, 문자, 이메일 등을 보내는 단계
- 조건 분기: 조건에 따라 다른 처리를 하는 단계 (if/else)
- 오류 처리: 입력이 잘못됐거나 오류가 발생했을 때 대응하는 단계

각 단계 설명은 개발을 모르는 학생도 이해할 수 있는 쉬운 말로 작성하세요.
일반적인 기능 흐름: 사용자 입력 → 데이터 조회/시스템 처리 → 결과 출력 (+ 필요 시 오류 처리)
처리 단계는 3~5개가 적당합니다.

반드시 아래 JSON 형식만 반환하고 다른 텍스트는 절대 포함하지 마세요:
{
  "cuts": [
    {
      "angle": "처리 유형 (위 7가지 중 하나)",
      "description": "이 단계에서 일어나는 일을 쉽게 설명 (1~2문장, 예: 사용자가 검색창에 음식 이름을 입력해요)",
      "dialogue": "입력 데이터 (예: 음식 이름, 학생 ID) — 없으면 빈 문자열",
      "soundEffect": "출력/결과 (예: 추천 식단 목록, 오류 안내 메시지) — 없으면 빈 문자열"
    }
  ]
}`,

  script: `당신은 SW 공모전 기획서 작성 도우미입니다.
아래 아이디어 발굴 대화 내용을 분석하여 기획서 초안을 작성해주세요.

사용자가 이미 작성한 기획서 내용이 있을 경우:
- 기존 내용과 겹치지 않는 보완 내용만 작성해주세요.
- 기존에 없는 섹션을 추가하거나, 얇게 작성된 섹션을 보강하는 내용을 작성해주세요.
기존 내용이 없으면 전체 기획서를 새로 작성해주세요.

반드시 아래 JSON 형식만 반환하고 다른 텍스트는 절대 포함하지 마세요:
{
  "script": "기획서 내용 (아래 형식으로 작성):\\n\\n[배경 및 필요성]\\n내용...\\n\\n[해결 방안]\\n내용...\\n\\n[주요 기능]\\n내용...\\n\\n[기대 효과]\\n내용..."
}`,
};

function buildUserMessage(transcript: string, existingContent?: Record<string, unknown>): string {
  let msg = `아이디어 발굴 대화 내용:\n\n${transcript}\n\n`;
  if (existingContent) {
    msg += `사용자가 이미 작성한 내용:\n${JSON.stringify(existingContent, null, 2)}\n\n`;
  }
  msg += `위 내용을 바탕으로 JSON을 생성해주세요.`;
  return msg;
}

export async function POST(req: NextRequest) {
  const { ideaChat, step, existingContent } = await req.json() as {
    ideaChat: ChatMessage[];
    step: string;
    existingContent?: Record<string, unknown>;
  };

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
          content: buildUserMessage(transcript, existingContent),
        },
      ],
    });

    const raw = response.content[0];
    if (raw.type !== "text") throw new Error("Unexpected response type");

    const jsonMatch = raw.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI 자동채우기 실패" }, { status: 500 });
  }
}
