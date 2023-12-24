import { getExecutor } from "@/langchain/agent";

export const runtime = "edge";
// Prevents this route's response from being cached
export const dynamic = "force-dynamic";

export async function GET() {
  const { executor, stream, handlers } = await getExecutor();
  executor.call(
    {
      input: "What is the square root of 2",
    },
    [handlers]
  );

  return new Response(stream.readable, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
