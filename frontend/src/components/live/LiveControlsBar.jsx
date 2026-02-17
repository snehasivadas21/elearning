import { useState } from "react";
import { Mic, MicOff, Video, VideoOff, Hand, Smile, PhoneOff } from "lucide-react";

const LiveControlsBar = ({
  micOn,
  cameraOn,
  handRaised,
  onToggleMic,
  onToggleCamera,
  onRaiseHand,
  onLeave,
  onReaction,
}) => {
  const reactions = ["👍", "😂", "👏", "❤️", "🔥"];
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className="h-20 bg-gray-800 flex items-center justify-center gap-6 relative">
      <button onClick={onToggleMic} className="p-3 rounded-full bg-gray-700">
        {micOn ? <Mic /> : <MicOff />}
      </button>

      <button onClick={onToggleCamera} className="p-3 rounded-full bg-gray-700">
        {cameraOn ? <Video /> : <VideoOff />}
      </button>

      <button
        onClick={onRaiseHand}
        className={`p-3 rounded-full ${
          handRaised ? "bg-yellow-500" : "bg-gray-700"
        }`}
      >
        <Hand />
      </button>

      {/* ✅ Emoji panel toggled by Smile button */}
      <div className="relative">
        <button
          onClick={() => setShowReactions((p) => !p)}
          className="p-3 rounded-full bg-gray-700"
        >
          <Smile />
        </button>

        {showReactions && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-gray-700 rounded-full px-3 py-2 flex gap-2">
            {reactions.map((r) => (
              <button
                key={r}
                onClick={() => {
                  onReaction(r);
                  setShowReactions(false);
                }}
                className="text-xl hover:scale-125 transition"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={onLeave} className="p-3 rounded-full bg-red-600">
        <PhoneOff />
      </button>
    </div>
  );
};

export default LiveControlsBar;