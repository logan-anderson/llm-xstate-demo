import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";

const model = new OpenAI({
  //   modelName: "gpt-4-1106-preview",
  temperature: 0,
});
const promptTemplate = PromptTemplate.fromTemplate(
  "Generate a Mermaid.js chart from the following query:{input}"
);

const chain = promptTemplate.pipe(model);

export const MermaidChartTool = new DynamicStructuredTool({
  name: "chart-generator",
  description:
    "Generate the text for a chart or diagram that can be used in the rest of the conversation. The output from this tool should be put in a mermaid code block",
  schema: z.object({
    input: z.string().describe("A query that describes a chart or a diagram"),
  }),
  func: async ({ input }) => {
    const output = await chain.invoke({ input });
    return output;
  },
});
