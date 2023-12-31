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
  const [state, send] = useMachine(chatMachine, {
    inspect: (inspectionEvent) => {
      if (inspectionEvent.type === "@xstate.event") {
        console.log(inspectionEvent.event);
      }
    },
  });

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
                        Used a tool! text: {message.text}
                        <br />
                        tool: {message.toolName}
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
          <div className="p-4 border-t flex">
            <Input
              disabled={state.matches("AgentMessage")}
              type="text"
              value={state.context?.userChatText}
              onChange={(e) => {
                send({ type: "userType", text: e.target.value });
              }}
              placeholder="Type a message"
              className="w-full mr-2 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
