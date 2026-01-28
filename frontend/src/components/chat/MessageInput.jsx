import { useState } from "react";

export default function MessageInput({ onSend }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;

    onSend({
      type: "chat.message",
      content: text,
    });

    setText("");
  };

  return (
    <div className="p-4 border-t flex gap-2">
      <input
        className="flex-1 border rounded px-3 py-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />

      <button
        onClick={handleSend}
        className="bg-blue-600 text-white px-4 rounded"
      >
        Send
      </button>
    </div>
  );
}
