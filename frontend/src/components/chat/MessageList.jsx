import { useRef, useEffect } from "react";

export default function MessageList({ messages, currentUserId }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 px-4 py-6 space-y-1">
      {messages.map((msg) => {
        const isSystem = msg.is_system;
        const isMine = msg.sender?.id === currentUserId;

        if (isSystem) {
          return (
            <div key={msg.id} className="flex justify-center py-3">
              <span className="px-3 py-1.5 rounded-full bg-gray-200/60 text-[11px] text-gray-500 font-medium">
                {msg.content}
              </span>
            </div>
          );
        }

        return (
          <div key={msg.id} className={`flex gap-2 py-1 ${isMine ? "justify-end" : "justify-start"}`}>
            {!isMine && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xs font-semibold text-blue-600 shrink-0 mt-auto mb-5">
                {msg.sender?.username?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            
            <div className={`flex flex-col max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
              {!isMine && (
                <span className="text-[11px] text-gray-500 font-medium mb-1 ml-1">
                  {msg.sender?.username}
                </span>
              )}
              
              <div
                className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                  isMine
                    ? "bg-blue-600 text-white rounded-br-md shadow-blue-600/10"
                    : "bg-white border border-gray-200/60 text-gray-800 rounded-bl-md"
                }`}
              >
                <p className="text-[14px] leading-relaxed">{msg.content}</p>
              </div>
              
              <span className="text-[10px] text-gray-400 mt-1 mx-1">
                {formatTime(msg.created_at)}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

