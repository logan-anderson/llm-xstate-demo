import { createMachine, assign } from "xstate";

type Message = {
  text: string;
  user: "agent" | "user";
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
    | { type: "type"; text: string };
}
export const chatMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QGMAWBDALgOgKqzACcBZOWdGAYgFsyKwBlMAOwgG0AGAXUVAAcA9rACWmYQOa8QAD0QAmAIwA2bEoCsAFgCcGuToAcHAMwalSgDQgAnvI1Hs2gOxH9Sx0o0KNHNQoC+fpZoWHgEJHQw2AAqVnzCzFCUmLFgnDxIIIIiYhJSsgiOatiOdtqadmpaRkZqljYICo5aDvqOyoYcStX6cgFBGDgAgjDMmKSw5FQQEqncUlmi4pIZ+Yoq6tq6BsamFtaIXvrYcicexgqdao59IMFDI2MRYNgAMgLoEPGJyXyz6fxCRa5FaINRyDTYDgKHouNSGfQaNRGOoHNQcVSI-RGJoaTwnFw3O7YYYsR4Teivd6fBKUACuBCiAgEABs0vNATllqB8mCIVCYfo4RwEUiUQhqkUwW05BxHPovFoSoSBsSHuNJs8YnEaT8-uzsks8ogtBx0XK5I4OHJquotGYxeCFNgFGC7UoLnpLZplSESaN1RStV86Qymay5hkFpyjQVnNgjFpFToNnotHIHVViljFApGsKPP5ArcVX6yRrQl9GSykik2ZGOYaQbH7Amk6ZNKn0-txXZVMLLUotApk1oAkXmAIIHApHd9UCuTJEABaGXHNTqDiI9feMyaMUrjQ+nD4IgBmBz6NNi3FUpaco1KomPb1NPOjzgk0mC2WoxH0Knp5oliL4L0bblEEcRwHSaYp3SHXFKh6Ro1D-UszzAUDgXA8UumwE19EFRMjDkW11DFXDiL0aFFRld1h1QtVALeD4QPrA0sMXBBPCdfDCKqEjKjI7tiOaORDBdNE4TlHwGNJdCgO1KBMIXfITTkSEE1o-QqlNYixRMJ1dEghQ5DUbdNELfpfUY8lInwSsw2UmN31UK5NCMJQERdYV9JqVQ71zK1PAIlCxyAA */
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
            type: {
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
          actions: assign({
            messages: ({ context }) => {
              return [
                ...context.messages,
                { text: context.userChatText, user: "user" } as Message,
                { text: "", user: "agent" } as Message,
              ];
            },
            userChatText: () => "",
          }),
        },
      },
    },

    AgentMessage: {
      states: {
        Loading: {
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
      initial: "Loading",
      on: {
        done: {
          target: "UserMessage",
        },
      },
    },
  },

  initial: "UserMessage",
});
