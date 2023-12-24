"use client";
import { useMachine } from "@xstate/react";
import { chatMachine } from "./machine";
export const ClientDataReader = () => {
  const [state, send] = useMachine(chatMachine);

  const streamData = async () => {
    const response = await fetch("/api/chat");
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

  return (
    <div>
      <button onClick={streamData}>Stream data</button>
      <div>State Value: {JSON.stringify(state.value)}</div>
      <div>State Context: {JSON.stringify(state.context)}</div>
      {state.matches("AgentMessage.UsingTool") && (
        <div>Using Tool!!!!!!!!!!!!!!!!!!!</div>
      )}
      <div>
        <div className="bg-white shadow-md rounded-lg max-w-lg w-full">
          <div className="p-4 h-80 overflow-y-auto">
            {state?.context?.messages?.map((message, index) => {
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
                    {message.text}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t flex">
            <input
              disabled={state.matches("AgentMessage")}
              id="user-input"
              type="text"
              value={state.context?.userChatText}
              onChange={(e) => {
                send({ type: "type", text: e.target.value });
              }}
              placeholder="Type a message"
              className="w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              disabled={state.matches("AgentMessage")}
              onClick={() => {
                send({
                  type: "messageSend",
                });
              }}
              id="send-button"
              className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition duration-300"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
