import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type Message = {
  role: "user" | "assistant";
  content: string;
};

// Sonnet 5.5는 thinking 블록이 텍스트 블록보다 먼저 올 수 있으므로 content[0]이 아니라 text 블록을 찾는다
export function extractText(content: Anthropic.ContentBlock[]): string {
  const block = content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  if (!block) throw new Error("Unexpected response type");
  return block.text;
}

export async function chat(
  messages: Message[],
  systemPrompt: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 2048,
    // thinking 토큰도 max_tokens에 포함되므로 effort를 지정해 답변이 잘리지 않게 한다
    output_config: { effort: "medium" },
    system: systemPrompt,
    messages,
  });

  return extractText(response.content);
}
