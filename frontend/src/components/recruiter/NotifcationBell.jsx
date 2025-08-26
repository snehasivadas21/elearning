import { useNotifications } from "@/context/NotificationSocketProvider";
import { useState } from "react";

export default function NotificationBell() {
  const { unread, recent, markRead, markAll } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative">
        <span className="material-icons">notifications</span>
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1 rounded-full">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="font-semibold">Notifications</span>
            {unread.length > 0 && (
              <button onClick={markAll} className="text-sm text-blue-600">Mark all as read</button>
            )}
          </div>
          {recent.length === 0 ? (
            <div className="p-4 text-gray-500">No notifications</div>
          ) : recent.map(n => (
            <div
              key={n.id}
              className={`p-3 border-b ${n.is_read ? "bg-white" : "bg-blue-50"}`}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <div className="text-sm font-medium">{n.title || "Notification"}</div>
              <div className="text-sm text-gray-700">{n.message}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
