import React, { useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

export default function ChatWindow({ courseId, token }) {
  const { messages, sendMessage } = useWebSocket({
    url: `ws://localhost:8000/ws/chat/course/${courseId}/`,
    token,
  });

  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      sendMessage({ message: text });
      setText("");
    }
  };

  return (
    <div className="border rounded p-4 w-full max-w-lg">
      <div className="h-64 overflow-y-auto border-b mb-3">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.username || "User"}:</strong> {msg.message}
          </div>
        ))}
      </div>

      <div className="flex">
        <input
          className="flex-1 border p-2 rounded-l"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 rounded-r"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}
