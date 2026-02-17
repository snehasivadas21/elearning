import { Bell, X } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { extractResults } from "../../api/api";

const NotificationBell = ({
  liveNotifications = [],
  chatNotifications = {},
  onChatOpen,
}) => {
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);
  const navigate = useNavigate();

  const normalizedLiveNotifications = extractResults({ data: liveNotifications });

  const liveCount = normalizedLiveNotifications.length;

  // ✅ Sum all message counts across rooms, not just unique room count
  const chatCount = Object.values(chatNotifications).reduce(
    (sum, count) => sum + count,
    0
  );

  const totalCount = liveCount + chatCount;
  const badgeLabel = totalCount > 99 ? "99+" : totalCount;

  return (
    <div className="relative" ref={bellRef}>
      <button className="relative" onClick={() => setOpen((p) => !p)}>
        <Bell className="w-6 h-6 text-gray-600 hover:text-blue-600" />

        {totalCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-1.5 rounded-full min-w-[18px] text-center leading-5">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white shadow-lg rounded-lg p-4 z-50 border">
          <div className="flex justify-between mb-2">
            <h4 className="font-semibold">Notifications</h4>
            <X size={18} className="cursor-pointer" onClick={() => setOpen(false)} />
          </div>

          {/* LIVE SESSIONS */}
          {normalizedLiveNotifications.map((n) => (
            <div
              key={n.session_id}
              onClick={() => {
                navigate(`/student/mycourses`);
                setOpen(false);
              }}
              className="border-l-4 border-red-500 bg-red-50 p-3 rounded cursor-pointer mb-2"
            >
              🔴 {n.title}
            </div>
          ))}

          {/* CHAT — one entry per room showing message count */}
          {Object.entries(chatNotifications).map(([roomId, count]) => (
            <div
              key={roomId}
              onClick={() => {
                onChatOpen(roomId);
                setOpen(false);
              }}
              className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded cursor-pointer mt-2 flex justify-between items-center"
            >
              <span>💬 New messages</span>
              <span className="bg-blue-600 text-white text-xs px-1.5 rounded-full min-w-[18px] text-center">
                {count}
              </span>
            </div>
          ))}

          {totalCount === 0 && (
            <p className="text-sm text-gray-500">No notifications</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;