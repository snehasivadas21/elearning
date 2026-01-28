export default function MessageList({ messages }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => (
        <div key={msg.id} className="flex gap-2">
          <div className="font-semibold">{msg.sender.username}</div>
          <div>
            <p>{msg.content}</p>
            <span className="text-xs text-gray-400">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
