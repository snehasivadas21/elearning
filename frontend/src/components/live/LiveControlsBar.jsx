import {Mic,MicOff,Video,VideoOff,Hand,Smile,PhoneOff} from "lucide-react";

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

  return (
    <div className="h-20 bg-gray-800 flex items-center justify-center gap-6">
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

      <button className="p-3 rounded-full bg-gray-700">
        <Smile />
      </button>
      {reactions.map(r => (
        <button
            key={r}
            onClick={() => onReaction(r)}
            className="text-xl hover:scale-110 transition"
        >
            {r}
        </button>
      ))}

      <button onClick={onLeave} className="p-3 rounded-full bg-red-600">
        <PhoneOff />
      </button>
    </div>
  );
};

export default LiveControlsBar;
