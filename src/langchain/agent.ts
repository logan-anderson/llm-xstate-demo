import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";
// import { SerpAPI } from "langchain/tools";
import { Calculator } from "langchain/tools/calculator";
import { LangChainStream } from "./streamCallbacks";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";

const tools = [new Calculator()];
const chat = new ChatOpenAI({
  modelName: "gpt-3.5-turbo-1106",
  temperature: 0,
  streaming: true,
  //   verbose: true,
});

const memory = new BufferMemory({
  memoryKey: "chat_history",
  //   TODO: add memory to chat model
  chatHistory: new ChatMessageHistory([]),
  returnMessages: true,
  outputKey: "output",
});
export const getExecutor = async () => {
  const { handlers, stream } = LangChainStream();
  const executor = await initializeAgentExecutorWithOptions(tools, chat, {
    memory,
    agentType: "openai-functions",
  });
  return { executor, stream, handlers };
};
