import { useState, useRef } from "react";
import { Send, Paperclip, Mic, X } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

export default function MessageInput({ onSend, onFileSend, disabled, roomId }) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = async () => {
    if (uploading) return;

    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (text.trim()) formData.append("content", text.trim());

        const res = await axiosInstance.post(
          `/chat/rooms/${roomId}/upload/`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        onFileSend(res.data.message.id); 
        setFile(null);
        setText("");
        fileInputRef.current.value = "";
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!text.trim()) return;
    onSend({ type: "chat_message", content: text });
    setText("");
  };

  const FILE_TYPE_ICON = {
    image: "🖼️",
    video: "🎥",
    audio: "🎵",
    document: "📄",
  };

  const getFileType = (f) => {
    const name = f.name.toLowerCase();
    if (name.match(/\.(jpg|jpeg|png|gif|webp)$/)) return "image";
    if (name.match(/\.(mp4|mov|webm)$/)) return "video";
    if (name.match(/\.(mp3|wav|ogg)$/)) return "audio";
    return "document";
  };

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-white/95 backdrop-blur-md">

      {file && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-xl text-sm text-gray-600">
          <span>{FILE_TYPE_ICON[getFileType(file)]}</span>
          <span className="truncate flex-1">{file.name}</span>
          <button
            onClick={() => { setFile(null); fileInputRef.current.value = ""; }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <div
        className={`flex items-center gap-1 rounded-2xl border bg-white px-2 py-1.5 transition-all duration-300 ease-out ${
          isFocused 
            ? "border-blue-400/40 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/5" 
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,.py,.js"
          onChange={(e) => setFile(e.target.files[0] || null)}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Paperclip className="h-[18px] w-[18px]" />
        </button>
        
        <input
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400 py-2 px-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={uploading ? "Uploading..." : "Type a message..."}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={uploading || disabled}
        />

        {text.trim() || file ? (
          <button
            onClick={handleSend}
            disabled={uploading}
            className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/25 disabled:opacity-50"
          >
            {uploading
              ? <span className="h-[18px] w-[18px] block animate-spin border-2 border-white border-t-transparent rounded-full" />
              : <Send className="h-[18px] w-[18px]" />
            }
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
