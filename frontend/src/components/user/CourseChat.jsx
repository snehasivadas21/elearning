import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";

export default function CourseChat({ courseId, isEnrolled, enrollLoading }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔒 BLOCK UI IF NOT ENROLLED
  if (enrollLoading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        Checking access to chatbot...
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="p-4 border rounded-lg bg-gray-100 text-gray-700">
        🔒 This AI assistant is available only for enrolled students.
      </div>
    );
  }

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("/ai/chat/", {
        course_id: courseId,
        question: input,
      });

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: res.data.answer },
      ]);
    } catch (err) {
      // ✅ HANDLE 403 GRACEFULLY
      if (err.response?.status === 403) {
        toast.error("You are not enrolled in this course.");
      } else {
        toast.error("AI service unavailable.");
      }

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ Unable to fetch response." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-xl p-4 mt-6 bg-white shadow">
      <h3 className="font-semibold text-lg mb-2">
        🤖 Course AI Assistant
      </h3>

      <div className="h-64 overflow-y-auto border p-3 rounded bg-gray-50 mb-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 ${
              m.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <span className="inline-block px-3 py-2 rounded-lg bg-white shadow">
              {m.text}
            </span>
          </div>
        ))}
        {loading && (
          <div className="text-sm text-gray-500">AI is thinking…</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a doubt from this course..."
          className="flex-1 border rounded px-3 py-2"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
