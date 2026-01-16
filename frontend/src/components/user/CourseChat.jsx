import { useState } from "react";
import axiosInstance from "../../api/axiosInstance"

const CourseChat = ({ courseId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("/ai/chat/", {
        course_id: courseId,
        question: userMsg.content,
      });

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: res.data.answer },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "AI error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="font-semibold mb-2">🤖 Course AI Assistant</h3>

      <div className="h-64 overflow-y-auto border p-2 mb-3 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm p-2 rounded ${
              m.role === "user"
                ? "bg-purple-100 text-right"
                : "bg-gray-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <p className="text-sm text-gray-400">Thinking...</p>}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Ask something from this course..."
        />
        <button
          onClick={sendMessage}
          className="bg-purple-600 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default CourseChat;
