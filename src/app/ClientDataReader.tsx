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
        const json = JSON.parse(decodedChunk);
        console.log({ json });
        send(json);
      }
    } catch (error) {
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
    </div>
  );
};
