import { ChatMachineTypes } from "@/app/machine";
import type { CallbackHandlerMethods } from "langchain/callbacks";

async function sendEvent({
  writer,
  data,
}: {
  writer: WritableStreamDefaultWriter<any>;
  data: ChatMachineTypes["events"];
}) {
  await writer.write(`${JSON.stringify(data)}\n`);
}

export function LangChainStream() {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  //   const runs = new Set();

  const handleError = async (e: Error, runId: string) => {
    //   runs.delete(runId);
    await writer.ready;
    await writer.abort(e);
  };

  return {
    stream: stream,
    handlers: {
      handleLLMNewToken: async (token: string) => {
        await writer.ready;
        await sendEvent({ writer, data: { text: token, type: "type" } });
      },
      handleChainEnd: async (_outputs: any, runId: string) => {
        await writer.ready;
        await sendEvent({ writer, data: { type: "done" } });
        await writer.close();
      },
      handleLLMStart: async (_llm: any, _prompts: string[], runId: string) => {
        // handleStart(runId);
      },
      handleLLMEnd: async (_output: any, runId: string) => {
        // await handleEnd(runId);
      },
      handleLLMError: async (e: Error, runId: string) => {
        await handleError(e, runId);
      },
      handleChatModelStart: async (
        _llm: any,
        _messages: any,
        runId: string
      ) => {
        // handleStart(runId);
      },
      handleChatModelEnd: async (_output: any, runId: string) => {
        // await handleEnd(runId);
      },
      handleChainStart: async (_chain: any, _inputs: any, runId: string) => {
        // handleStart(runId);
      },
      //   handleChainEnd: async (_outputs: any, runId: string) => {
      // await handleEnd(runId);
      //   },
      handleChainError: async (e: Error, runId: string) => {
        await handleError(e, runId);
      },
      handleToolStart: async (_tool: any, _input: string, runId: string) => {
        // handleStart(runId);
      },
      handleToolEnd: async (output: string, runId: string) => {
        // writer.write(`<Observation>${output}</Observation>\n`);
        // await handleEnd(runId);
      },
      handleToolError: async (e: Error, runId: string) => {
        // await handleError(e, runId);
      },
      handleAgentAction: async (_action: any, runId: string) => {
        // handleStart(runId);
      },
      handleAgentEnd: async (_output: any, runId: string) => {
        // await handleEnd(runId);
      },
    } as CallbackHandlerMethods,
  };
}
