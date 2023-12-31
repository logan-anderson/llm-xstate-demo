import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";
// import { SerpAPI } from "langchain/tools";
import { Calculator } from "langchain/tools/calculator";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";

import type { Message } from "@/types";
import { LangChainStream } from "./streamCallbacks";
import {
  HumanMessage,
  AIMessage,
  FunctionMessage,
  SystemMessage,
} from "langchain/schema";

const tools = [new Calculator()];
const chat = new ChatOpenAI({
  modelName: "gpt-3.5-turbo-1106",
  temperature: 0,
  streaming: true,
  //   verbose: true,
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
        content: message.text || "",
        name: message.user,
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
  });
  return { executor, stream, handlers };
};
