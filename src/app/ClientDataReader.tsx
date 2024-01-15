"use client";
import { useMachine } from "@xstate/react";
import { chatMachine } from "./machine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/icons";
import { useMarkdownProcessor } from "@/hooks";

export const AssistantMessage = ({ text }: { text: string }) => {
  const content = useMarkdownProcessor(text);
  return content;
};

export const ClientDataReader = () => {
  const [state, send] = useMachine(chatMachine);

  return (
    <div>
      <div>
        <div className="bg-white shadow-md rounded-lg w-full">
          <div className="p-4 min-h-80 overflow-y-auto">
            {state?.context?.messages
              ?.filter((x) => {
                if (x.user === "assistant") {
                  return Boolean(x.text);
                }
                return true;
              })
              .map((message, index) => {
                if (message.user == "tool") {
                  return (
                    <div className="mb-2 text-left" key={index}>
                      <div
                        className={` bg-gray-200 text-gray-700 rounded-lg py-2 px-4 inline-block`}
                      >
                        Used a tool!
                        <br />
                        tool: {message.toolName}
                        <br />
                        text: {message.text}
                        <br />
                        input: {message.toolInput}
                        <br />
                        output: {message.toolOutput}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    className={`mb-2 ${
                      message.user === "user" ? "text-right" : ""
                    }`}
                    key={index}
                  >
                    <p
                      className={`${
                        message.user === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      } rounded-lg py-2 px-4 inline-block`}
                    >
                      {message.user === "user" && message.text}
                      {message.user === "assistant" && (
                        <AssistantMessage text={message.text} />
                      )}
                    </p>
                  </div>
                );
              })}
            {state.matches("AgentMessage.Loading") && (
              <Spinner className="animate-spin" />
            )}
          </div>
          <div className="flex items-center h-[20%] border-t p-4">
            <Input
              disabled={state.matches("AgentMessage")}
              type="text"
              value={state.context?.userChatText}
              onChange={(e) => {
                send({ type: "userType", text: e.target.value });
              }}
              placeholder="Type your message..."
              className="flex-grow mr-2"
            />
            <Button
              disabled={
                state.matches("AgentMessage") || !state.context.userChatText
              }
              onClick={() => {
                send({
                  type: "messageSend",
                });
              }}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
