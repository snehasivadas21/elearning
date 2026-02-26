import { useEffect, useState } from "react";
import axiosinstance from "../../api/axiosInstance";
import SessionModal from "../../components/tutor/SessionModal";
import { extractResults } from "../../api/api";
import Pagination from "../../components/ui/Pagination";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const InstructorLiveListPage = () => {
  const [sessions, setSessions] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const navigate = useNavigate();
  const totalPages = Math.ceil(count / 10);

  const fetchSessions = async () => {
    try {
      const res = await axiosinstance.get(
        "/live/tutor/session/list/",
        { params: { page } }
      );
      setSessions(extractResults(res));
      setCount(res.data.count);
    } catch {
      toast.error("Failed to load sessions");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page]);

  const openConfirm = (id, actionType) => {
    setConfirmData({ id, actionType });
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmData) return;

    try {
      setLoadingAction(true);

      await axiosinstance.post(
        `/live/${confirmData.id}/${confirmData.actionType}/`
      );

      toast.success(
        `Session ${confirmData.actionType}ed successfully`
      );

      setConfirmOpen(false);
      fetchSessions();
    } catch {
      toast.error(
        `Failed to ${confirmData.actionType} session`
      );
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="p-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-purple-600">
          Live Sessions
        </h1>
        <button
          onClick={() => {
            setEditingSession(null);
            setOpenModal(true);
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 transition text-white rounded-lg shadow"
        >
          + Create Live
        </button>
      </div>

      {/* Empty */}
      {sessions.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          No live sessions found.
        </div>
      )}

      {/* Table */}
      {sessions.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Course</th>
                <th className="p-3">Scheduled At</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="p-3">{s.title}</td>
                  <td className="p-3">{s.course_title}</td>
                  <td className="p-3">
                    {s.scheduled_at
                      ? new Date(s.scheduled_at).toLocaleString()
                      : "-"}
                  </td>

                  <td className="p-3">
                    {s.status === "scheduled" && (
                      <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                        Scheduled
                      </span>
                    )}
                    {s.status === "ongoing" && (
                      <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full font-semibold animate-pulse">
                        ONGOING
                      </span>
                    )}
                    {s.status === "ended" && (
                      <span className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                        Ended
                      </span>
                    )}
                  </td>

                  <td className="p-3">
                    <div className="flex gap-2 justify-center flex-wrap">
                      {s.status === "scheduled" && (
                        <>
                          <button
                            onClick={() =>
                              openConfirm(s.id, "start")
                            }
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                          >
                            Start
                          </button>

                          <button
                            onClick={() => {
                              setEditingSession(s);
                              setOpenModal(true);
                            }}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              openConfirm(s.id, "cancel")
                            }
                            className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {s.status === "ongoing" && (
                        <>
                          <button
                            onClick={() =>
                              navigate(`/tutor/live/${s.id}/`)
                            }
                            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                          >
                            Enter Live
                          </button>

                          <button
                            onClick={() =>
                              openConfirm(s.id, "end")
                            }
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                          >
                            End
                          </button>
                        </>
                      )}

                      {s.status === "ended" && (
                        <span className="text-sm text-gray-400">
                          —
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <SessionModal
        open={openModal}
        session={editingSession}
        onClose={() => setOpenModal(false)}
        onSuccess={() => {
          setOpenModal(false);
          fetchSessions();
        }}
      />

      {/* Pagination */}
      <div className="mt-6">
        <Pagination
          page={page}
          totalPages={totalPages}
          setPage={setPage}
        />
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              Confirm Action
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to{" "}
              <strong>{confirmData?.actionType}</strong> this
              session?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
                disabled={loadingAction}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmAction}
                disabled={loadingAction}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loadingAction ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorLiveListPage;