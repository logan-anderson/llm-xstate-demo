import { Message } from "@/types";
import { getExecutor } from "@/langchain/agent";

export const runtime = "edge";
// Prevents this route's response from being cached
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const messages: Message[] = JSON.parse(searchParams.get("messages") || "[]");

  const { executor, stream, handlers } = await getExecutor({ messages });
  const lastMessage = messages[messages.length - 1];
  const input = lastMessage.text;
  executor.call(
    {
      input,
    },
    [handlers]
  );

  return new Response(stream.readable, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
