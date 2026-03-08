import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import AddQuestionModal from "../../components/tutor/AddQuestionModal";
import { toast } from "react-toastify";
import { Trash2, Pencil, Plus, AlertTriangle, X, ChevronDown, ChevronUp } from "lucide-react";

// ── In-app confirmation dialog ──────────────────────────────────────────────
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, danger = true }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${danger ? "bg-red-100" : "bg-yellow-100"}`}>
            <AlertTriangle size={20} className={danger ? "text-red-600" : "text-yellow-600"} />
          </div>
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
        </div>
        <p className="text-sm text-slate-500">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-yellow-500 hover:bg-yellow-600"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Quiz inline form ────────────────────────────────────────────────────
const EditQuizForm = ({ quiz, onSave, onCancel }) => {
  const [form, setForm] = useState({
    title: quiz.title,
    pass_percentage: quiz.pass_percentage,
    max_attempts: quiz.max_attempts,
    time_limit: quiz.time_limit || "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Edit Quiz Settings</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-slate-500 font-medium">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium">Pass Percentage (%)</label>
          <input
            name="pass_percentage"
            type="number"
            min="0" max="100"
            value={form.pass_percentage}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium">Max Attempts</label>
          <input
            name="max_attempts"
            type="number"
            min="1"
            value={form.max_attempts}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition">
          Cancel
        </button>
        <button onClick={() => onSave(form)} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          Save Changes
        </button>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
export default function TutorQuizManagementPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseStatus, setCourseStatus] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);

  // Confirm dialog state
  const [confirm, setConfirm] = useState({
    open: false, title: "", message: "", onConfirm: null,
  });

  const openConfirm = (title, message, onConfirm) =>
    setConfirm({ open: true, title, message, onConfirm });

  const closeConfirm = () =>
    setConfirm({ open: false, title: "", message: "", onConfirm: null });

  // submitted = locked for edit/delete; draft/approved = editable
  const isSubmitted = courseStatus === "submitted";

  // Tutors can always add questions (industry standard — content can grow)
  // But cannot edit/delete when course is under review
  const canModify = !isSubmitted;

  useEffect(() => {
    fetchQuiz();
    fetchAttempts();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const res = await axiosInstance.get(`/quiz/quizzes/${quizId}/`);
      setQuiz(res.data);
      const courseRes = await axiosInstance.get(`/instructor/courses/${res.data.course}/`);
      setCourseStatus(courseRes.data.status);
    } catch {
      toast.error("Failed to load quiz.");
    }
  };

  const fetchAttempts = async () => {
    try {
      const res = await axiosInstance.get(`/quiz/quizzes/${quizId}/attempts/`);
      setAttempts(res.data);
    } catch {
      console.error("Failed to load attempts");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuiz = async (form) => {
    try {
      const payload = {
        title: form.title,
        pass_percentage: Number(form.pass_percentage),
        max_attempts: Number(form.max_attempts),
      };
      if (form.time_limit) payload.time_limit = Number(form.time_limit);

      const res = await axiosInstance.patch(`/quiz/quizzes/${quizId}/`, payload);
      setQuiz((prev) => ({ ...prev, ...res.data }));
      setIsEditingQuiz(false);
      toast.success("Quiz updated!");
    } catch {
      toast.error("Failed to update quiz.");
    }
  };

  const handleDeleteQuiz = () => {
    openConfirm(
      "Delete Quiz",
      "This will permanently delete the quiz and all its questions. This cannot be undone.",
      async () => {
        try {
          await axiosInstance.delete(`/quiz/quizzes/${quizId}/`);
          toast.success("Quiz deleted.");
          navigate(-1);
        } catch {
          toast.error("Failed to delete quiz.");
        }
        closeConfirm();
      }
    );
  };

  const handleDeleteQuestion = (questionId) => {
    openConfirm(
      "Delete Question",
      "Are you sure you want to delete this question?",
      async () => {
        try {
          await axiosInstance.delete(`/quiz/questions/${questionId}/`);
          fetchQuiz();
          toast.success("Question deleted.");
        } catch {
          toast.error("Failed to delete question.");
        }
        closeConfirm();
      }
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />

      {/* Status banner */}
      {isSubmitted && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm font-medium">
          <AlertTriangle size={16} />
          Course is under review. Editing and deleting are disabled. You can still add new questions.
        </div>
      )}

      {/* Quiz Settings Card */}
      <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{quiz?.title}</h1>
            <div className="flex gap-4 mt-2 text-sm text-slate-500">
              <span>Pass: <strong className="text-slate-700">{quiz?.pass_percentage}%</strong></span>
              <span>Max Attempts: <strong className="text-slate-700">{quiz?.max_attempts}</strong></span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsEditingQuiz((v) => !v)}
              disabled={!canModify}
              title={isSubmitted ? "Disabled while under review" : "Edit quiz settings"}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition
                ${canModify
                  ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
            >
              <Pencil size={14} />
              Edit
            </button>

            <button
              onClick={handleDeleteQuiz}
              disabled={!canModify}
              title={isSubmitted ? "Disabled while under review" : "Delete quiz"}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition
                ${canModify
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>

        {isEditingQuiz && (
          <EditQuizForm
            quiz={quiz}
            onSave={handleSaveQuiz}
            onCancel={() => setIsEditingQuiz(false)}
          />
        )}
      </div>

      {/* Questions Card */}
      <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-slate-800">
            Questions <span className="text-slate-400 font-normal text-sm">({quiz?.questions?.length || 0})</span>
          </h2>
          {/* Always allow adding questions */}
          <button
            onClick={() => { setSelectedQuestion(null); setShowModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition"
          >
            <Plus size={15} />
            Add Question
          </button>
        </div>

        <div className="space-y-3">
          {quiz?.questions?.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-6">No questions yet. Add your first question!</p>
          )}
          {quiz?.questions?.map((question, idx) => (
            <div key={question.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-sm font-semibold text-slate-700">
                  {idx + 1}. {question.text}
                  <span className="ml-2 text-xs font-normal text-slate-400">({question.marks} mark{question.marks !== 1 ? "s" : ""})</span>
                </p>

                {canModify && (
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => { setSelectedQuestion(question); setShowModal(true); }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>

              <ul className="space-y-1 pl-2">
                {question.options.map((opt) => (
                  <li key={opt.id} className={`text-sm flex items-center gap-2 ${opt.is_correct ? "text-emerald-600 font-medium" : "text-slate-600"}`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${opt.is_correct ? "bg-emerald-500" : "bg-slate-300"}`} />
                    {opt.text}
                    {opt.is_correct && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Correct</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Student Attempts Card */}
      <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-5">
          Student Attempts <span className="text-slate-400 font-normal text-sm">({attempts.length})</span>
        </h2>

        {attempts.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No attempts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Student</th>
                  <th className="pb-3 font-semibold">Attempt</th>
                  <th className="pb-3 font-semibold">Score</th>
                  <th className="pb-3 font-semibold">Percentage</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-medium text-slate-700">{attempt.user_email}</td>
                    <td className="py-3 text-slate-500">#{attempt.attempt_number}</td>
                    <td className="py-3 text-slate-700">{attempt.score}</td>
                    <td className="py-3 text-slate-700">{attempt.percentage}%</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${attempt.is_passed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"}`}>
                        {attempt.is_passed ? "Passed" : "Failed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddQuestionModal
          quizId={quizId}
          questionData={selectedQuestion}
          onClose={() => { setShowModal(false); setSelectedQuestion(null); }}
          onSuccess={fetchQuiz}
        />
      )}
    </div>
  );
}