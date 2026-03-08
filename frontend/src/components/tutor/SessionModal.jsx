import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { extractResults } from "../../api/api";
import { X, Loader2 } from "lucide-react";

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
    if (open) {
      if (session) {
        setForm({
          title: session.title,
          description: session.description,
          course: session.course,
          scheduled_at: session.scheduled_at?.slice(0, 16),
          allow_early_join: session.allow_early_join,
        });
      } else {
        setForm({
          title: "",
          description: "",
          course: "",
          scheduled_at: "",
          allow_early_join: false,
        });
      }
    }
  }, [open, session]);

  useEffect(() => {
    if (open) {
      axiosInstance.get("/instructor/courses/")
        .then(res => {
          const data = extractResults(res);
          console.log("COURSES:", data);
          setCourses(data);
        })
        .catch(console.error);
    }
  }, [open]);

  if (!open) return null;

  const inputClass =
    "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-slate-400 transition";

  const submit = async () => {
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.course ||
      !form.scheduled_at
    ) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);
      if (session) {
        await axiosInstance.patch(`/live/tutor/session/${session.id}/`, form);
        toast.success("Live session updated!");
      } else {
        await axiosInstance.post("/live/tutor/session/", form);
        toast.success("Live session created!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Session error:", err.response?.data);
      toast.error(err.response?.data?.detail || "Failed to save session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">
            {session ? "Edit Live Session" : "Create Live Session"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</label>
            <input
              placeholder="e.g. React Hooks Deep Dive"
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              placeholder="What will be covered in this session?"
              className={inputClass + " resize-none"}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</label>
            <select
              className={inputClass}
              value={form.course}
              onChange={(e) => setForm({ ...form, course: Number( e.target.value )})}
            >
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled At</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allow_early_join}
              onChange={(e) => setForm({ ...form, allow_early_join: e.target.checked })}
              className="w-4 h-4 accent-purple-600"
            />
            Allow students to join early
          </label>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={submit}
            className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 
                       disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : session ? "Update Session" : "Create Session"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SessionModal;