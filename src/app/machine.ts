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
    | { type: "useTool" }
    | { type: "userType"; text: string }
    | { type: "agentType"; text: string };
}

export const chatMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QGMAWBDALgOgKqzACcBZOWdGAYgFsyKwBlMAOwgG0AGAXUVAAcA9rACWmYQOa8QAD0QBaAIwLsAJgDMATjUr1HNQoAcmpQBoQAT0QBWDh2wB2dfbUA2HRwAsGlxoC+vszQsPAISOhhsABVzPmFmKEoAV1DovjBOHiQQQRExCSlZBB0PBw8FDw57KwUVcs8DM0si+w1sDQMDDw97DiMNKys1K39AjBwAQRhmTFJYcioICXTuKRzRcUkswtqXbBcrLw8VDQ8DPQ8XF0bEcoNVHRcK-Q59+xGQIImpmfCwbAAZAToCBxBL0aapZaZfhCdb5LaIRzKQxKcpuBTtLTXBBDZRuMpHFz2BS9Dh+AIfMbYSYsH5zegAoEg+JJAiRAQCAA2GVWsLym1AhTcKmw2k8FxUzhJF2xKg6bUuVmJtw0KiV70+1O+s3mf1SoMo4MwkJ5WTW-IKNxUemwlSVBn6BisKjcVwsiGOJQMRIUblVag66mGFM1NOmOoZ+pZyTA7K5pphuQ2loQBmJDg41szaguA06su69xdLgUgwMx3U5NGwTDdN1IVBcc5hu+JpWZr5yYRCG8u0qPgDaceJJU2KG9lFViJXXaU685IpzAEEDgUk+vKT8MF8jRbS0qJcpI0NQa7oQh+wDo0xL0AwqL1LGqp+CIEZgG7hApk8nae-0SkPM5j0lbFDD7AMlBeP0c0uJ9ghfMJ6QiKMoA-C1uzkGw-wPI8ansWVnFFEtM0MNU1B6KtKRrbVfjQrttwQCVVEgol8WPB0PFAqxWivKUrCMPRDxUOCvlpN8-kBYFQTordvwQao7FqElWJULxDBOWVywcDFDwOF1rQ6EStTE34ohiaSO03L9ChJWxRQJcp+OdV1ZROS8fT9dRAyGIza3Eht4ibGTrMRCo2m4qoFHI4dM001ooo8KcXjJfQ1DUfx-CAA */
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
              // after streamRes add a blank agent Message
              assign({
                messages: ({ context }) => {
                  return [
                    ...context.messages,
                    { text: "", user: "assistant" } as Message,
                  ];
                },
              }),
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
                    const oldMessages = context.messages.slice(0, -1);
                    const lastMessage =
                      context.messages[context.messages.length - 1];
                    lastMessage.text += event.text;
                    return [...oldMessages, lastMessage];
                  },
                }),
              },
              useTool: "UsingTool",
            },
          },
          Typing: {
            on: {
              agentType: {
                target: "Typing",
                actions: assign({
                  messages: ({ event, context }) => {
                    const oldMessages = context.messages.slice(0, -1);
                    const lastMessage =
                      context.messages[context.messages.length - 1];
                    lastMessage.text += event.text;
                    return [...oldMessages, lastMessage];
                  },
                }),
              },
              useTool: "UsingTool",
            },
          },
          UsingTool: {
            on: {
              agentType: "Typing",
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
      streamRes: async ({ context, self }) => {
        streamData({
          messages: context.messages,
          send: self.send,
        });
      },
    },
  }
);
