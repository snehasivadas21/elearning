import { Bell, X } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const eventLabel = (event) => {
  if (event === "live_started")   return { icon: "🔴", text: "Live Now",   style: "border-red-500 bg-red-50" };
  if (event === "live_created")   return { icon: "📅", text: "Scheduled",  style: "border-yellow-500 bg-yellow-50" };
  if (event === "live_cancelled") return { icon: "❌", text: "Cancelled",  style: "border-gray-400 bg-gray-50" };
  return                                 { icon: "📢", text: "Session",    style: "border-blue-500 bg-blue-50" };
};

const NotificationBell = ({
  liveNotifications = [],
  chatNotifications = {},
  onChatOpen,
  onDismiss,
  onDismissAll,
}) => {
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);
  const navigate = useNavigate();

  const liveCount = liveNotifications.length;

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
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold">Notifications</h4>
            <div className="flex items-center gap-2">
              {totalCount > 0 && (
                <button
                  onClick={onDismissAll}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Clear all
                </button>
              )}
              <X size={18} className="cursor-pointer" onClick={() => setOpen(false)} />
            </div>
          </div>

          {/* LIVE SESSION NOTIFICATIONS */}
          {liveNotifications.map((n) => {
            const { icon, text, style } = eventLabel(n.event);
            return (
              <div
                key={n.session_id}
                className={`border-l-4 ${style} p-3 rounded mb-2 flex justify-between items-start gap-2`}
              >
                <span
                  className="cursor-pointer flex-1 text-sm"
                  onClick={() => {
                    navigate("/student/mycourses");
                    setOpen(false);
                  }}
                >
                  {icon} <span className="font-medium">{text}:</span> {n.title}
                </span>
                <X
                  size={14}
                  className="cursor-pointer mt-0.5 text-gray-400 hover:text-red-500 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(n.session_id);
                  }}
                />
              </div>
            );
          })}

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