import { useEffect, useState } from "react";
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

        if (data.length > 0){
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
      <div className="w-72 border-r overflow-y-auto">
        <h2 className="p-4 font-semibold">Community Chats</h2>
        <div className="p-4 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-72 border-r overflow-y-auto">
        <h2 className="p-4 font-semibold">Community Chats</h2>
        <div className="p-4 text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-72 border-r overflow-y-auto">
      <h2 className="p-4 font-semibold">Community Chats</h2>

      {rooms.length === 0 ? (
        <div className="p-4 text-gray-500">No chat rooms available</div>
      ) : (
        rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className={`p-4 cursor-pointer border-b hover:bg-gray-100 ${
              activeRoomId === room.id ? "bg-gray-200" : ""
            }`}
          >
            <div className="font-medium">{room.course_title || room.name}</div>

            {room.last_message && (
              <div className="text-sm text-gray-500 truncate">
                {room.last_message.sender.username}:{" "}
                {room.last_message.content}
              </div>
            )}

            {room.unread_count > 0 && (
              <span className="text-xs bg-blue-600 text-white px-2 rounded">
                {room.unread_count}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}