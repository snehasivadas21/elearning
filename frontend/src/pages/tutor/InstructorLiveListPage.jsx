import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosPrivate from "../../../api/axiosPrivate";

const InstructorLiveListPage = () => {
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axiosPrivate.get("/live/")
      .then(res => setSessions(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-semibold">Live Sessions</h1>
        <button
          onClick={() => navigate("/instructor/live/create")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Create Live
        </button>
      </div>

      <div className="space-y-4">
        {sessions.map(s => (
          <div key={s.id} className="border p-4 rounded">
            <h3 className="font-medium">{s.title}</h3>
            <p className="text-sm text-gray-500">
              {new Date(s.scheduled_at).toLocaleString()}
            </p>

            <div className="mt-3 flex gap-3">
              {s.status === "scheduled" && (
                <button
                  onClick={() => navigate(`/instructor/live/${s.id}`)}
                  className="text-blue-600"
                >
                  Manage
                </button>
              )}

              {s.status === "ongoing" && (
                <span className="text-green-600 font-medium">LIVE</span>
              )}

              {s.status === "ended" && (
                <span className="text-gray-400">Ended</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstructorLiveListPage;
