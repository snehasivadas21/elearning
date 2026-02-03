import { useEffect, useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import { extractResults } from "../../api/api";

export default function ChatSidebar({ onSelectRoom, activeRoomId, onRoomLoaded }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/chat/rooms/");
        const data = extractResults(res);
        setRooms(data);

        if (data.length > 0) {
          onRoomLoaded?.(data[0]);
        }
      } catch (err) {
        console.error("Error fetching chat rooms:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    if (rooms.length > 0 && !activeRoomId) {
      onSelectRoom(rooms[0]);
    }
  }, [rooms, activeRoomId, onSelectRoom]);

  if (loading) {
    return (
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Community Chats</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Community Chats</h2>
        </div>
        <div className="p-4">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800">Community Chats</h2>
        <p className="text-xs text-gray-500 mt-0.5">{rooms.length} conversations</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No chat rooms available</p>
          </div>
        ) : (
          <div className="py-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={`mx-2 mb-1 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  activeRoomId === room.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                    activeRoomId === room.id
                      ? "bg-blue-600 text-white"
                      : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600"
                  }`}>
                    {(room.course_title || room.name)?.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium text-sm truncate ${
                        activeRoomId === room.id ? "text-blue-900" : "text-gray-800"
                      }`}>
                        {room.course_title || room.name}
                      </span>
                      
                      {room.unread_count > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-600 text-white rounded-full shrink-0">
                          {room.unread_count}
                        </span>
                      )}
                    </div>

                    {room.last_message && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        <span className="font-medium">{room.last_message.sender.username}:</span>{" "}
                        {room.last_message.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
