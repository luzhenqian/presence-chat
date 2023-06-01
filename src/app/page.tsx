"use client";

import { Loading } from "./components/Loading";
import { IChannel, createPresence } from "@yomo/presence";
import { useEffect, useState } from "react";

export default function Chat() {
  const [channel, setChannel] = useState<IChannel | null>(null);
  const [msgs, setMsgs] = useState<
    { msg: string; id: string; timestamp: Date }[]
  >([]);
  const [msg, setMsg] = useState<string>("");
  const [id, setId] = useState<string>("");
  useEffect(() => {
    (async () => {
      const id = Math.random().toString().substring(2, 10);
      const avatar =
        Math.random() > 0.5 ? `https://robohash.org/${id}` : void 0;
      const presencePromise = createPresence(
        process.env.NEXT_PUBLIC_PRESENCE_URL!,
        {
          publicKey: process.env.NEXT_PUBLIC_PRESENCE_PUBLIC_KEY,
          id,
        }
      );

      setId(id);
      const presence = await presencePromise;
      const channel = presence.joinChannel("test");
      channel.subscribe(
        "msg",
        ({
          state: { id },
          payload: { msg },
        }: {
          state: { id: string };
          payload: { msg: string };
        }) => {
          setMsgs((msgs) => [
            ...msgs,
            {
              id,
              msg,
              timestamp: new Date(),
            },
          ]);
        }
      );
      setChannel(channel);
    })();
    return () => {
      channel?.leave();
      setChannel(null);
    };
  }, []);

  const sendMsg = () => {
    if (!msg) {
      return;
    }
    // save self message
    setMsgs((msgs) => [
      ...msgs,
      {
        msg,
        id,
        timestamp: new Date(),
      },
    ]);
    // send message to other peers
    channel?.broadcast("msg", {
      msg,
      id,
    });
    // clear input
    setMsg("");
  };

  if (!channel) {
    // loading use tailwind style
    return <Loading />;
  }

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen gap-4">
      {/* title twitter style */}
      <div className="flex items-center justify-between w-1/2 p-2 border border-gray-300 rounded-lg">
        <h1>
          <span className="text-2xl font-bold">
            <span className="text-blue-400">Presence</span> Chat
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
          <div className="text-xl font-bold">{id}</div>
        </div>
      </div>

      {/* chat area */}
      <div className="flex flex-col w-1/2 p-2 overflow-y-auto border border-gray-300 rounded-lg h-[600px]">
        {msgs.length === 0 && (
          <div className="text-center text-gray-500">No message</div>
        )}
        {msgs.map((msg, i) => (
          <div
            key={i}
            className="inline-flex flex-col w-auto gap-1 p-2 mb-2 rounded-lg"
            style={{
              backgroundColor: msg.id === id ? "#e6f3ff" : "#fff",
              border: msg.id === id ? "1px solid #c8e1ff" : "1px solid #e6ecf0",
              alignSelf: msg.id === id ? "flex-end" : "flex-start",
            }}
          >
            <div className="font-bold dark:text-black">{msg.msg}</div>
            <div className="text-xs text-gray-500">{msg.id}</div>
          </div>
        ))}
      </div>

      {/* action area */}
      <div className="flex flex-col w-1/2">
        <input
          type="text"
          value={msg}
          onChange={(e) => {
            setMsg(e.target.value);
          }}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:text-black"
          placeholder="Type your message here"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMsg();
            }
          }}
        />

        <button
          onClick={() => {
            sendMsg();
          }}
          className="w-full p-2 mt-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
