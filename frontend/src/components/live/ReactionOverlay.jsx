const ReactionOverlay = ({ reactions }) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {reactions.map((r) => (
        <span
          key={r.id}              // ✅ r.id is now set in useLiveSessionSocket
          className="absolute bottom-10 text-3xl select-none animate-bounce"
          style={{ left: `${r.x}%` }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
};

export default ReactionOverlay;