import { useNavigate } from "react-router-dom";

const LiveSessionBanner = ({ session }) => {
  const navigate = useNavigate();

  if (!session) return null;

  const canJoin =
    session.status === "ongoing" || session.allow_early_join;

  return (
    <div className="border-l-4 border-red-500 bg-red-50 p-4 mb-6 rounded">
      <h3 className="font-semibold text-red-700">🔴 Live Session</h3>

      <p className="text-sm mt-1">
        {session.scheduled_at
          ? new Date(session.scheduled_at).toLocaleString()
          : "To be announced"}
      </p>

      {canJoin ? (
        <button
          onClick={() => navigate(`/student/live/${session.id}`)}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded"
        >
          Join Live
        </button>
      ) : (
        <p className="mt-3 text-sm text-gray-600">
          Live session has not started yet
        </p>
      )}
    </div>
  );
};

export default LiveSessionBanner;
