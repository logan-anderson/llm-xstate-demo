import { ChatMachineTypes } from "@/app/machine";

export const runtime = "edge";
// Prevents this route's response from being cached
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function sendEvent({
  controller,
  data,
}: {
  controller: ReadableStreamDefaultController<any>;
  data: ChatMachineTypes["events"];
}) {
  controller.enqueue(encoder.encode(JSON.stringify(data)));
}

// This method must be named GET
export async function GET() {
  // This encoder will stream your text
  const customReadable = new ReadableStream({
    start: async (controller) => {
      // Start encoding 'Basic Streaming Test',
      // and add the resulting stream to the queue
      const chars = ["H", "e", "l", "l", "o", " ", "W", "o", "r", "l", "d"];
      for (const char of chars) {
        console.log({ sending: char });
        sendEvent({
          controller,
          data: {
            text: char,
            type: "type",
          },
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      sendEvent({
        controller,
        data: {
          type: "done",
        },
      });
      // Prevent anything else being added to the stream
      controller.close();
    },
  });

  return new Response(customReadable, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
