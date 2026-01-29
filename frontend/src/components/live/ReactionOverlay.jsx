import { useEffect, useState } from "react";

const ReactionOverlay = ({ reactions }) => {
  return (
    <div className="pointer-events-none absolute inset-0">
      {reactions.map(r => (
        <span
          key={r.id}
          className="absolute bottom-10 text-3xl animate-float"
          style={{ left: `${r.x}%` }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
};

export default ReactionOverlay;
