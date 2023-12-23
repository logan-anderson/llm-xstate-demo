"use client";
import { useActorRef, useMachine } from "@xstate/react";
import { useEffect, useState } from "react";
import { chatMachine } from "./machine";
export const ClientDataReader = () => {
  const [loading, setLoading] = useState(false);
  const [state, send] = useMachine(chatMachine);

  const streamData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/chat");
      if (!response.ok || !response.body) {
        throw response.statusText;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          setLoading(false);
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
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={streamData}>Stream data</button>
      <div>
        <button
          onClick={() => {
            send({
              type: "done",
            });
          }}
        >
          AI MESSAGE DONE
        </button>
      </div>
      <div>
        <button
          onClick={() => {
            send({
              type: "messageSend",
            });
          }}
        >
          {" "}
          Send Message
        </button>
      </div>
      <div>
        <input
          type="text"
          className="border-2 border-gray-300 bg-white h-10 px-5 pr-16 rounded-lg text-sm focus:outline-none"
          onChange={(e) => {
            send({ type: "type", text: e.target.value });
          }}
        />
      </div>
      <div>State Value: {JSON.stringify(state.value)}</div>
      <div>State Context: {JSON.stringify(state.context)}</div>
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
              id="user-input"
              type="text"
              placeholder="Type a message"
              className="w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
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
