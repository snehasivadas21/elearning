import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useCourseNotifySocket from "../../hooks/useCourseNotifySocket"
import axiosInstance from "../../api/axiosInstance";

const LiveWaitingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [canJoin, setCanJoin] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await axiosInstance.get(`/live/${id}/`);
        setSession(res.data);

        if (res.data.status === "ongoing") {
          setCanJoin(true);
        }
      } catch (err) {
        console.error("Failed to load live session", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  const { notification } = useCourseNotifySocket(session?.course);

  useEffect(() => {
    if (!notification) return;

    if (
      notification.event === "session_reminder" &&
      notification.session_id === id
    ) {
      navigate(`/live/${id}`);
    }
  }, [notification, id]);

  if (loading) return <p>Loading live session...</p>;
  if (!session) return <p>Session not found</p>;

  return (
    <div className="max-w-xl mx-auto mt-20 text-center">
      <h1 className="text-2xl font-semibold">{session.title}</h1>

      <p className="text-gray-500 mt-2">
        Scheduled at:{" "}
        {session.scheduled_at
          ? new Date(session.scheduled_at).toLocaleString()
          : "TBA"}
      </p>

      <div className="mt-6">
        <span
          className={`px-4 py-1 rounded-full text-sm ${
            canJoin
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {canJoin ? "Live Now" : "Waiting for instructor"}
        </span>
      </div>

      <button
        disabled={!canJoin}
        onClick={() => navigate(`/tutor/live/${id}`)}
        className={`mt-8 w-full py-3 rounded-lg font-medium ${
          canJoin
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-600 cursor-not-allowed"
        }`}
      >
        Join Live Session
      </button>
    </div>
  );
};

export default LiveWaitingPage;
