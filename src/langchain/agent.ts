import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { SerpAPI, WikipediaQueryRun } from "langchain/tools";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";

import type { Message } from "@/types";
import { LangChainStream } from "./streamCallbacks";
import {
  HumanMessage,
  AIMessage,
  FunctionMessage,
  SystemMessage,
} from "langchain/schema";
import { CodeExecutionTool, MermaidChartTool } from "./tools";

const tools = [
  CodeExecutionTool,
  MermaidChartTool,
  new WikipediaQueryRun({
    topKResults: 3,
    maxDocContentLength: 4000,
  }),
  new SerpAPI(),
];

const chat = new ChatOpenAI({
  modelName: "gpt-3.5-turbo-1106",
  // modelName: "gpt-4-1106-preview",
  temperature: 0,
  streaming: true,
});

export const getExecutor = async ({ messages }: { messages: Message[] }) => {
  const { handlers, stream } = LangChainStream();
  // TODO: use functions instead of tool
  const memoryMessages = messages.slice(0, -1).map((message) => {
    if (message.user === "user")
      return new HumanMessage({ content: message.text });
    if (message.user === "assistant")
      return new AIMessage({ content: message.text });
    if (message.user === "tool")
      return new FunctionMessage({
        content:
          `Input: ${message.toolInput}\nOutput: ${message.toolOutput}` || "",
        name: message.toolName || message.user,
      });
    if (message.user === "system")
      return new SystemMessage({ content: message.text });

    throw new Error(
      "Unknown message type. Must be one of user, assistant, tool, system"
    );
  });

  const memory = new BufferMemory({
    memoryKey: "chat_history",
    chatHistory: new ChatMessageHistory(memoryMessages),
    returnMessages: true,
    outputKey: "output",
  });
  const executor = await initializeAgentExecutorWithOptions(tools, chat, {
    memory,
    agentType: "openai-functions",
    agentArgs: {
      systemMessage: new SystemMessage({
        content:
          "You are a helpful AI assistant. Always research using the tools available when applicable. You will always respond in markdown format.",
      }),
    },
  });
  return { executor, stream, handlers };
};
