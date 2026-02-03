import { useState } from "react";
import { Send, Smile, Paperclip, Mic } from "lucide-react";

export default function MessageInput({ onSend }) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend({ type: "chat.message", content: text });
    setText("");
  };

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-white/95 backdrop-blur-md">
      <div
        className={`flex items-center gap-1 rounded-2xl border bg-white px-2 py-1.5 transition-all duration-300 ease-out ${
          isFocused 
            ? "border-blue-400/40 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/5" 
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <button type="button" className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Paperclip className="h-[18px] w-[18px]" />
        </button>
        
        <input
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400 py-2 px-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        <button type="button" className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Smile className="h-[18px] w-[18px]" />
        </button>

        {text.trim() ? (
          <button
            onClick={handleSend}
            className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/25"
          >
            <Send className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <button type="button" className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <Mic className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
    </div>
  );
}
