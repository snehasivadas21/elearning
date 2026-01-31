import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { extractResults } from "../../api/api";

const SessionModal = ({ open, onClose, onSuccess, session }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    course: "",
    scheduled_at: "",
    allow_early_join: false,
  });

  useEffect(() => {
    if (session) {
      setForm({
        title: session.title,
        description: session.description,
        course: session.course,
        scheduled_at: session.scheduled_at?.slice(0, 16),
        allow_early_join: session.allow_early_join,
      });
    }
  }, [session]);

  useEffect(() => {
    if (open) {
      axiosInstance.get("/instructor/courses/")
        .then(res => setCourses(extractResults(res)))
        .catch(console.error);
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!form.title || !form.description || !form.course || !form.scheduled_at) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);
      if (session) {
        await axiosInstance.patch(`/live/tutor/session/${session.id}/`, form);
        toast.success("Live session updated");
      } else {
        await axiosInstance.post("/live/tutor/session/",form);
        toast.success("Live session created");
      }  
        onSuccess();
        onClose();
      } catch (err) {
        toast.error("Failed to create session");
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{session ? "Edit Live Session" : "Create Live Session"}</h2>

        <input
          placeholder="Session title"
          className="input w-full mb-3"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />

        <input
          placeholder="Session description"
          className="input w-full mb-3"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />

        <select
          className="input w-full mb-3"
          value={form.course}
          onChange={e => setForm({ ...form, course: e.target.value })}
        >
          <option value="">Select course</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          className="input w-full mb-3"
          onChange={e =>
            setForm({ ...form, scheduled_at: e.target.value })
          }
        />

        <label className="flex items-center gap-2 mb-4 text-sm">
          <input
            type="checkbox"
            checked={form.allow_early_join}
            onChange={e =>
              setForm({ ...form, allow_early_join: e.target.checked })
            }
          />
          Allow students to join early
        </label>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={submit}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            {loading ? "Saving..." : session ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;
