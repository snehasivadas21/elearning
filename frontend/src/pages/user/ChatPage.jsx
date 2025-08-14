import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

export default function ChatPage() {
  const { courseId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const token = localStorage.getItem("access"); // JWT token

  // Connect WebSocket
  useEffect(() => {
    const wsUrl = `ws://localhost:8000/ws/chat/${courseId}/?token=${token}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => console.log("✅ WebSocket connected");

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "chat.message") {
        setMessages((prev) => [...prev, data]);
      } else if (data.type === "chat.online") {
        setOnlineUsers(data.users);
      } else if (data.type === "chat.typing") {
        const { username } = data;
        setTypingUsers((prev) => [...new Set([...prev, username])]);

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== username));
        }, 2000);
      }
    };

    wsRef.current.onclose = () => console.log("❌ WebSocket disconnected");

    return () => wsRef.current.close();
  }, [courseId, token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send new message
  const sendMessage = () => {
    if (newMessage.trim() && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "chat.message", message: newMessage }));
      setNewMessage("");
    }
  };

  // Notify typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "chat.typing" }));
    }
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-100">
      <h2 className="text-xl font-bold mb-4">Course Chat #{courseId}</h2>

      <div className="flex flex-1 gap-4">
        {/* Messages Panel */}
        <div className="flex-1 flex flex-col bg-white p-3 rounded shadow overflow-y-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className="mb-2">
              <span className="font-semibold">{msg.username || "User"}:</span>{" "}
              <span>{msg.message}</span>
              {msg.is_read && <span className="text-sm text-green-500 ml-1">✔</span>}
            </div>
          ))}
          <div ref={messagesEndRef} />
          {typingUsers.length > 0 && (
            <div className="text-sm text-gray-500 mt-1">
              {typingUsers.join(", ")} typing...
            </div>
          )}
        </div>

        {/* Online Users Panel */}
        <div className="w-48 bg-white p-3 rounded shadow flex flex-col">
          <h4 className="font-semibold mb-2">Online Users</h4>
          {onlineUsers.map((user) => (
            <div key={user.id} className="text-gray-700 mb-1">
              {user.username}
            </div>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="flex mt-3">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-l px-3 py-2"
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
