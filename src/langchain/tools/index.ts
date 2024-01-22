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
    "Generate the text for a chart or diagram that can be used in the rest of the conversation. The output from this tool should be put in a mermaid code block.",
  schema: z.object({
    input: z.string().describe("A query that describes a chart or a diagram"),
  }),
  func: async ({ input }) => {
    const output = await chain.invoke({ input });
    return output;
  },
});

export const CodeExecutionTool = new DynamicStructuredTool({
  name: "code-execution",
  description:
    "Execute python code. The input should be raw python code as a sting. The program always print any result to stdout.",
  schema: z.object({
    input: z
      .string()
      .describe(
        "Raw code to be executed. Must be python code and must print the result to stdout using the print function."
      ),
    // I could add multiple languages here at some point.
    // language: z.union([
    //   z.literal("python"),
    //   z.literal("javascript"),
    //   z.literal("typescript"),
    //   z.literal("nodejs"),
    // ]),
  }),
  func: async ({ input }) => {
    const lines = input.split("\n");
    // If the last line doesn't have a print statement, add one.
    if (!input.includes("print(")) {
      lines[lines.length - 1] = `print(${lines[lines.length - 1]})`;
    }
    input = lines.join("\n");
    const url = "https://onecompiler-apis.p.rapidapi.com/api/v1/run";
    const options = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": process.env.RAPID_API_KEY!,
        "X-RapidAPI-Host": process.env.RAPID_API_HOST!,
      },
      body: JSON.stringify({
        language: "python",
        files: [
          {
            name: "main.py",
            content: input,
          },
        ],
      }),
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      console.log({ result });
      return result.stdout;
    } catch (error) {
      console.error(error);
    }
  },
});
