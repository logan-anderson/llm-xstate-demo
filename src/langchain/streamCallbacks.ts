import { ChatMachineTypes } from "@/app/machine";
import type { CallbackHandlerMethods } from "langchain/callbacks";
import { AgentAction } from "langchain/schema";

async function sendEvent({
  writer,
  data,
}: {
  writer: WritableStreamDefaultWriter<any>;
  data: ChatMachineTypes["events"];
}) {
  await writer.ready;
  await writer.write(`${JSON.stringify(data)}\n`);
}

export function LangChainStream() {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const handleError = async (e: Error, runId: string) => {
    await writer.ready;
    await writer.abort(e);
  };

  return {
    stream: stream,
    handlers: {
      handleLLMNewToken: async (token: string) => {
        if (token)
          await sendEvent({ writer, data: { text: token, type: "agentType" } });
      },
      handleChainEnd: async (_outputs: any, runId: string) => {
        await sendEvent({ writer, data: { type: "done" } });
        await writer.close();
      },
      handleLLMError: async (e: Error, runId: string) => {
        await handleError(e, runId);
      },
      handleChainError: async (e: Error, runId: string) => {
        await handleError(e, runId);
      },
      handleToolEnd: async (output: string, runId: string) => {
        await sendEvent({
          writer,
          data: {
            type: "doneUseTool",
            toolOutput: output,
          },
        });
      },
      handleToolError: async (e: Error, runId: string) => {
        await handleError(e, runId);
      },
      handleAgentAction: async (action: AgentAction, runId: string) => {
        await sendEvent({
          writer,
          data: {
            type: "useTool",
            toolName: action.tool,
            // @ts-ignore
            toolInput: action.toolInput?.input,
            log: action.log,
          },
        });
      },
    } as CallbackHandlerMethods,
  };
}
