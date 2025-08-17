import React, { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import useWebSocket from "../../hooks/useWebSocker";

const ChatPage = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const role = location.state?.role || "student";
  const { messages, sendMessage, onlineUsers, typingUsers } = useWebSocket(courseId);

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      sendMessage({ type: "chat.message", message: newMessage });
      setNewMessage("");
    }
  };

  const handleTyping = () => {
    sendMessage({ type: "chat.typing" });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-blue-600 text-white p-4 font-bold">
        Chat Room: {role === "instructor" ? "Instructor Chat" : "Course Chat"} #{courseId}
      </div>

      <div className="bg-gray-200 p-2 text-sm">
        Online users: {Array.isArray(onlineUsers) ? onlineUsers.length : 0}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {Array.isArray(messages) && 
          messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg ${
                msg.type === "chat.message" ? "bg-white shadow" : "text-gray-500 text-sm"
              }`}
            >
              {msg.username && <span className="font-semibold mr-2">{msg.username}:</span>}
              {msg.message}
            </div>
          ))}
        <div ref={messagesEndRef} />
        {typingUsers.length > 0 && (
          <div className="text-gray-500 italic">
            {typingUsers.join(", ")} typing...
          </div>
        )}
      </div>

      <div className="p-4 bg-white flex gap-2 border-t">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
