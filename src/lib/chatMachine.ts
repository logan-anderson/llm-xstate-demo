import { Message } from "@/types";
import { createMachine, assign } from "xstate";

const streamData = async ({
  send,
  messages,
}: {
  messages: Message[];
  send: (json: any) => void;
}) => {
  const params = new URLSearchParams();
  params.set("messages", JSON.stringify(messages));
  const test = params.toString();
  const response = await fetch(`/api/chat?${test}`);
  if (!response.ok || !response.body) {
    throw response.statusText;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    const decodedChunk = decoder.decode(value, { stream: true });

    decodedChunk
      .split("\n")
      .filter(Boolean)
      .forEach((line) => {
        try {
          const json = JSON.parse(line);
          send(json);
        } catch (error) {
          console.log(error);
        }
      });
  }
};
export interface ChatMachineTypes {
  context: {
    userChatText: string;
    messages: Message[];
  };
  // value: {
  //   UserMessage: "Typing";
  //   AgentMessage: "Typing" | "Loading" | "UsingTool";
  // };
  events:
    | { type: "messageSend" }
    | { type: "done" }
    | {
        type: "useTool";
        log?: string;
        toolInput?: string;
        toolName: string;
      }
    | {
        type: "doneUseTool";
        toolOutput: string;
        toolName?: string;
        log?: string;
        text?: string;
      }
    | { type: "userType"; text: string }
    | { type: "agentType"; text: string };
}

export const chatMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QGMAWBDALgOgKqzACcBZOWdGAYgFsyKwBlMAOwgG0AGAXUVAAcA9rACWmYQOa8QAD0QBaAIwLsAJgDMATjUr1HNQoAcmpQBoQAT0QBWDh2wB2dfbUA2HRwAsGlxoC+vszQsPAISOhhsABVzPmFmKEoAV1DovjBOHiQQQRExCSlZBB0PBw8FDw57KwUVcs8DM0si+w1sDQMDDw97DiMNKys1K39AjBwAQRhmTFJYcioICXTuKRzRcUkswtqXbBcrLw8VDQ8DPQ8XF0bEcoNVHRcK-Q59+xGQIImpmfCwbAAZAToCBxBL0aapZaZfhCdb5LaIE52VwuBQuNQGVEqAwna4IDz6BwuDhWRzooYaSrvT7YSYsH5zegAoEg+JJAiRAQCAA2GVWsLym1AhTcKmw2k8FxUzgUniuFkQ2Lu3leSlOGhUpOpY1p31m8z+qVBlHBmEhfKya0FBRuKj02EqpJxVgMVhUbnlTWOJUx9jRx3UHXUwwCHx1dOm+qZRrZyTAnJ5FphuQ2NoQBj9Dg4duzaguA06eJU3Xu7tRgwMAc02uCEYZBpCoIT3JN33NK0tAtTCIQKod9h8GIzj1lKjxQ3s4qsLnsXXa068flDNLrUYi+CbXJbi2YYHw8a3SeyXfhwsQPjFLg6FyvfuODQVCAxdheal6dpxniG-lDzAEEDgKRPn5FNTxkeRyl2DQtCUNFeg4DQagfJpiWwHENEcMpamLYMaxwfcwkZGAQLhIVwIQOR2jaGClGJM5EOlPFDF2PQDBqexhwUJdRmCAi10NGJQRI60ezkGxqP0Wj4IY+wi2ccVUWzQxNTUHpuLDWs9V+YTuzPfE3FUJQXgHYtEJxDwmKsVp0KqTouhJaUXDw3V6X45lgSEztQLIwpqjsWpZRnNwvEMXFH2xMU-W8EkjjcXoDGc1dfiiQT4h0sDCiMu48z9Hp9idSsi2gtCXTnaDMUqDDEq0oi-g3eJm3SnzEFnOx+gw6pVJHbMixxbAFDzacXgQ-Q1DUH9fCAA */
    id: "chat",
    context: {
      userChatText: "",
      messages: [],
    },
    types: {} as ChatMachineTypes,
    states: {
      UserMessage: {
        states: {
          Typing: {
            on: {
              userType: {
                actions: assign({
                  userChatText: ({ event }) => {
                    return event.text;
                  },
                }),
                target: "Typing",
              },
            },
          },
        },
        initial: "Typing",
        on: {
          messageSend: {
            target: "AgentMessage",
            actions: [
              assign({
                messages: ({ context }) => {
                  return [
                    ...context.messages,
                    { text: context.userChatText, user: "user" } as Message,
                  ];
                },
                userChatText: () => "",
              }),
              { type: "streamRes", params: {} },
            ],
          },
        },
      },

      AgentMessage: {
        states: {
          Loading: {
            on: {
              agentType: {
                target: "Typing",
                actions: assign({
                  messages: ({ event, context }) => {
                    if (!event.text) return context.messages;
                    const oldMessages = context.messages.slice(0, -1);
                    const lastMessage =
                      context.messages[context.messages.length - 1];

                    if (lastMessage.user === "assistant") {
                      lastMessage.text += event.text;
                      return [...oldMessages, lastMessage];
                    }
                    return [
                      ...context.messages,
                      {
                        text: event.text,
                        user: "assistant" as const,
                      },
                    ] as Message[];
                  },
                }),
              },

              useTool: {
                target: "UsingTool",
                actions: [{ type: "onUseToolAction" }],
              },
            },
          },

          Typing: {
            on: {
              agentType: {
                target: "Typing",
                actions: assign({
                  messages: ({ event, context }) => {
                    if (!event.text) return context.messages;
                    const oldMessages = context.messages.slice(0, -1);
                    const lastMessage = {
                      ...context.messages[context.messages.length - 1],
                    };

                    if (lastMessage.user === "assistant") {
                      lastMessage.text += event.text;
                      return [...oldMessages, lastMessage];
                    }

                    return [
                      ...context.messages,
                      {
                        text: event.text,
                        user: "assistant" as const,
                      },
                    ] as Message[];
                  },
                }),
              },
              useTool: {
                target: "UsingTool",
                actions: [{ type: "onUseToolAction" }],
              },
            },
          },

          UsingTool: {
            on: {
              // TODO: Does this need to be here?
              // agentType: "Typing",
              doneUseTool: {
                target: "Loading",
                actions: [{ type: "onUseToolAction" }],
              },
            },
          },
        },
        initial: "Loading",
        on: {
          done: {
            target: "UserMessage",
          },
        },
      },
    },

    initial: "UserMessage",
  },
  {
    actions: {
      onUseToolAction: assign({
        messages: ({ event, context }) => {
          if (event.type === "useTool") {
            const newMessage: Message = {
              toolName: event.toolName,
              logs: event.log ? [event.log] : [],
              user: "tool" as const,
              toolInput: event.toolInput,
              text: "",
            };
            return [...context.messages, newMessage];
          }
          const lastMessage = context.messages[context.messages.length - 1];
          if (event.type === "doneUseTool" && lastMessage.user === "tool") {
            if (event.log) {
              lastMessage.logs = lastMessage.logs
                ? [...lastMessage.logs, event.log]
                : [event.log];
            }

            if (event.text) lastMessage.text = lastMessage.text + event.text;

            if (event.toolName) lastMessage.toolName = event.toolName;

            if (event.toolOutput) lastMessage.toolOutput = event.toolOutput;

            return [...context.messages.slice(0, -1), lastMessage];
          }
          return context.messages;
        },
      }),
      streamRes: async ({ context, self }) => {
        streamData({
          messages: context.messages,
          send: self.send,
        });
      },
    },
  }
);
