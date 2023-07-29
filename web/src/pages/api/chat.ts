import { AnthropicStream, StreamingTextResponse } from "ai";
import { env } from "~/env.mjs";

export const runtime = "edge";

export interface Message {
  content: string;
  role: "user" | "assistant";
}

function buildPrompt(messages: Message[]) {
  return (
    messages
      .map(({ content, role }) => {
        if (role === "user") {
          return `Human: ${content}`;
        } else {
          return `Assistant: ${content}`;
        }
      })
      .join("\n\n") + "Assistant:"
  );
}

export default async function handler(req: Request, res: Response) {
  const { messages } = await req.json();

  const response = await fetch("https://api.anthropic.com/v1/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      prompt: buildPrompt(messages),
      model: "claude-2.0",
      max_tokens_to_sample: 300,
      temperature: 0.9,
      stream: true,
    }),
  });

  if (!response.ok) {
    return new Response(await response.text(), {
      status: response.status,
    });
  }

  const stream = AnthropicStream(response);
  return new StreamingTextResponse(stream);
}
