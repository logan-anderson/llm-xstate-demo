import { createMachine, assign } from "xstate";

export const toggleMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcD2UoBswDoCSAdgIYDGyAlgG5gDEaG2A2gAwC6ioADqrORagQ4gAHogAcAZhwSArACY5EgCwA2ZQE4l6lXIA0IAJ6IAjCrE4xM+WIDszS3JvrjNgL6v99LLgCCZKrReTGxC3Lz8gkgiJswyOEo2MpLGkmIqKjYq+kYIxjgqSc72xnJizOVKCe4eIASoEHBCQWChPHzkAkKiCAC0JczxJYrpZUqW2Yg9lvkqSswlNhKaEo7unuje+MT+1K3hHZGg3T02coMKEiPMYzITCGU46ur2YqoymUoy9msgzTh+FF2UTC7U6UW6cgyOHmEmYikSMmMMnUekM4nUOHecjGxm0xlUkiU1VcQA */
  id: "toggle",
  initial: "Inactive",
  states: {
    Inactive: {
      on: { toggle: "Active" },
    },
    Active: {
      on: { toggle: "Inactive" },
    },
  },
});

type Message = {
  text: string;
  user: "agent" | "user";
};
export interface ChatMachineTypes {
  context: {
    messages: Message[];
  };
  events:
    | { type: "messageSend" }
    | { type: "done" }
    | { type: "useTool" }
    | { type: "type"; text: string };
}
export const chatMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QGMAWBDALgYgLZ1nRgGUwA7CAbQAYBdRUABwHtYBLTN5shkAT0QBaAEwBmAHQBOaZIDsANmqT5AVgCMwtQBZhAGhAAPRNuHVx1NWpUr5ADmEOtorQF8X+tFmwRuYGvSQQFnZObl4BBBEJGTlFZXVNHX0jBBMzCysbe0dnNw8MTHEAVVgwACcAWQIiMHEAFT5GNjIobExGvzpeYI4uHkCU4R1xeS1VFUlhWS1rCdt9CLVpcWFbWy1qW1lqHXltPJBPQoBBGDJMKthCGG9ff27WXrCBxBmzLW2LeXjqIdkF4zyCSiWRDX6iSQ2aiyBQHI7iU7kC7VGDiAA2zHQEGarXajE6ASYj1C-VAKVkKgkwhsIOk31Ealk834xhUZlGKlsKk0bOstkZcIKCLOyKuNXRmOxLWwAFdSnVmMw0fdAj0SbxyZSVjTZHTJAymQCEFN5CMNjymdTVNR5IKsMKkZdrrUGk1pXiCQ8Qn0NcYNLZzGpbHZRktPsyIg41NrqL8Q3ZtEy7ScRU7xa6cbL5YrlV1VcSfS9UrHhCNaVYFNzJBYjVNo9ROXtRLZJC3RAzkw7zmnUSUcQqlW0Oiqid7nmTjCWy7qK6phNW1EbRKZxGstGoQRCsvPbe5DkKSuUe2A8CiwKQKCOggXx4ZXrHxHzfvrtB94ka1NRgaDzVvFDDdz3MhmAgOBeCOL0nlJO9IiGI0oikGRbD-ZdNDUTtD0qM9IPVIs4JZVJLCkVQtC2OQlFEBsVAw0osLFVEMxaHDCwnBBQVrHZHx2dsf3kYQ9lsTtEW7bD8zHaCUgmWRxFBZstGkDcdBbI0gXEVCX3XUEpmXITUzPCUsRxZjbxSDkZLEdYFOcVZJA-FRpIcLYJnkzkNzsXTHX0xioGMiS-U0FYYSDIMHCGZxawUcwKWsL8gRsD4PJE+jaj7FoBzRXzfQQLZoxbezREpDZdRtCLTVsTZGSDcqdg2UQ3DcIA */
  id: "chat",
  context: {
    messages: [{ text: "", user: "user" }],
  },
  types: {} as ChatMachineTypes,
  states: {
    UserMessage: {
      states: {
        Typing: {
          on: {
            type: {
              actions: assign({
                messages: ({ event, context }) => {
                  const oldMessages = context.messages.slice(0, -1);
                  return [
                    ...oldMessages,
                    { text: event.text, user: "user" } as Message,
                  ];
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
          actions: assign({
            messages: ({ context }) => {
              return [
                ...context.messages,
                { text: "", user: "agent" } as Message,
              ];
            },
          }),
        },
      },
    },

    AgentMessage: {
      states: {
        loading: {
          on: {
            type: {
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
            type: {
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
            type: "Typing",
          },
        },
      },
      initial: "loading",
      on: {
        done: {
          target: "UserMessage",
          actions: assign({
            messages: ({ context }) => {
              return [
                ...context.messages,
                { text: "", user: "user" } as Message,
              ];
            },
          }),
        },
      },
    },
  },

  initial: "UserMessage",
});
