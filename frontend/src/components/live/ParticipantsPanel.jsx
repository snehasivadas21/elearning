const ParticipantsPanel = ({ participants }) => {
  return (
    <div className="w-64 bg-gray-800 p-4 border-l border-gray-700">
      <h3 className="font-semibold mb-3">
        Participants ({participants.length})
      </h3>

      <ul className="space-y-2 text-sm">
        {participants.map((p) => (
          <li key={p.id} className="flex justify-between items-center">
            <span>
              👤 {p.name || `User ${p.user_id}`}
            </span>
            <span className="flex gap-2">
              {p.hand_raised && "✋"}
              {p.is_muted ? "🔇" : "🎤"}
            </span>

            {p.role === "instructor" && (
              <span className="text-xs text-blue-400">Host</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ParticipantsPanel;
