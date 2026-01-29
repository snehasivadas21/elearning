import { useNavigate } from "react-router-dom";

const LiveSessionBanner = ({ session }) => {
  const navigate = useNavigate();

  const join = () => {
    if (session.status === "ongoing") {
      navigate(`/student/live/${session.id}`);
    } else {
      navigate(`/student/live/${session.id}/wait`);
    }
  };

  return (
    <div className="border-l-4 border-red-500 bg-red-50 p-4 mb-6 rounded">
      <h3 className="font-semibold text-red-700">
        🔴 Live Session
      </h3>

      <p className="text-sm mt-1">
        {new Date(session.scheduled_at).toLocaleString()}
      </p>

      <button
        onClick={join}
        className="mt-3 bg-red-600 text-white px-4 py-2 rounded"
      >
        Join Live
      </button>
    </div>
  );
};

export default LiveSessionBanner;
