import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";
// import { SerpAPI } from "langchain/tools";
import { Calculator } from "langchain/tools/calculator";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";

import type { Message } from "@/types";
import { LangChainStream } from "./streamCallbacks";
import { ChatMessage } from "langchain/schema";

const tools = [new Calculator()];
const chat = new ChatOpenAI({
  modelName: "gpt-3.5-turbo-1106",
  temperature: 0,
  streaming: true,
  //   verbose: true,
});

export const getExecutor = async ({ messages }: { messages: Message[] }) => {
  const { handlers, stream } = LangChainStream();
  const memoryMessages: ChatMessage[] = messages.slice(0, -2).map((message) => {
    return new ChatMessage({ content: message.text, role: message.user });
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
  });
  return { executor, stream, handlers };
};
