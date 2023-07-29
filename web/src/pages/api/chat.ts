import { AnthropicStream, StreamingTextResponse } from "ai";
import { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env.mjs";

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

// Build a prompt from the messages
export interface Message {
  content: string;
  role: "system" | "user" | "assistant";
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

export async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { messages } = req.body;

  const response = await fetch("https://api.anthropic.com/v1/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      prompt: buildPrompt(messages),
      model: "claude-v1",
      max_tokens_to_sample: 300,
      temperature: 0.9,
      stream: true,
    }),
  });

  // Check for errors
  if (!response.ok) {
    return new Response(await response.text(), {
      status: response.status,
    });
  }

  // Convert the response into a friendly text-stream
  const stream = AnthropicStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
