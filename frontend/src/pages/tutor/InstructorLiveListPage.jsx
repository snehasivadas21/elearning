import { useEffect, useState } from "react";
import axiosinstance from "../../api/axiosInstance";
import SessionModal from "../../components/tutor/SessionModal";
import { extractResults } from "../../api/api";
import Pagination from "../../components/ui/Pagination";
import { useNavigate } from "react-router-dom";

const InstructorLiveListPage = () => {
  const [sessions, setSessions] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [page,setPage] = useState(1);
  const [count,setCount] = useState(0);
  const navigate = useNavigate();

  const totalPages = Math.ceil(count / 10); 

  const fetchSessions = async () => {
    try {
      const res = await axiosinstance.get("/live/tutor/session/list/",{params:{page}
      });
      setSessions(extractResults(res));
      setCount(res.data.count)
    } catch (err) {
      console.error("Failer to load",err);
    }
  };  

  useEffect(()=>{
    fetchSessions();
  },[page]);

  const startSession = async (id) => {
    await axiosinstance.post(`/live/${id}/start/`);
    fetchSessions();
  };

  const endSession = async (id) => {
    await axiosinstance.post(`/live/${id}/end/`);
    fetchSessions();
  };

  const cancelSession = async (id) => {
    await axiosinstance.post(`/live/${id}/cancel/`);
    fetchSessions();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-purple-600">Live Sessions</h1>
        <button
          onClick={() => {
            setEditingSession(null);
            setOpenModal(true)
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded"
        >
          + Create Live
        </button>
      </div>
      
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="p-2">Title</th>
              <th className="p-2">Course</th>
              <th className="p-2">Scheduled At</th>
              <th className="p-2">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.map(s => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.title}</td>
                <td className="p-2">{s.course}</td>
                <td className="p-2">
                  {s.scheduled_at
                    ? new Date(s.scheduled_at).toLocaleString()
                    : "-"}
                </td>
                <td className="p-2">
                  {s.status === "scheduled" && (
                    <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                      Scheduled
                    </span>
                  )}

                  {s.status === "ongoing" && (
                    <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full font-semibold">
                      LIVE
                    </span>
                  )}

                  {s.status === "ended" && (
                    <span className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                      Ended
                    </span>
                  )}
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2 justify-center">

                    {s.status === "scheduled" && (
                      <>
                        <button
                          onClick={() => startSession(s.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                        >
                          Start
                        </button>

                        <button
                          onClick={() => {
                            setEditingSession(s);
                            setOpenModal(true);
                          }}
                          className="px-3 py-1 text-sm border rounded"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => cancelSession(s.id)}
                          className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {s.status === "ongoing" && (
                      <>
                        <button
                          onClick={() => navigate(`/tutor/live/${s.id}/wait`)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                        >
                          Enter Live
                        </button>

                        <button
                          onClick={() => endSession(s.id)}
                          className="px-3 py-1 text-sm border rounded"
                        >
                          End
                        </button>
                      </>
                    )}

                    {s.status === "ended" && (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SessionModal
        open={openModal}
        session={editingSession}
        onClose={() => setOpenModal(false)}
        onSuccess={()=>{
          setOpenModal(false);
          fetchSessions();
        }}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />
    </div>
  );
};

export default InstructorLiveListPage;
