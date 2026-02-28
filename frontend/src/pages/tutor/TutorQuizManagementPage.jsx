import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import AddQuestionModal from "../../components/tutor/AddQuestionModal";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function TutorQuizManagementPage() {
  const { quizId } = useParams(); 
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [courseStatus, setCourseStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuiz();
    fetchAttempts();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const res = await axiosInstance.get(`/quiz/quizzes/${quizId}/`);
      setQuiz(res.data);

      // fetch course to get status
      const courseRes = await axiosInstance.get(
        `/instructor/courses/${res.data.course}/`
      );
      setCourseStatus(courseRes.data.status);

    } catch (err) {
      console.error("Failed to load quiz");
    }
  };

  const fetchAttempts = async () => {
    try {
      const res = await axiosInstance.get(`/quiz/quizzes/${quizId}/attempts/`);
      setAttempts(res.data);
    } catch (err) {
      console.error("Failed to load attempts");
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuiz = async () => {
    try {
      const res = await axiosInstance.patch(`/quiz/quizzes/${quizId}/`, {
        title: quiz.title,
        pass_percentage: quiz.pass_percentage,
        max_attempts: quiz.max_attempts,
      });
      setQuiz(res.data);
      toast.success("Quiz updated!");
    } catch (err) {
      console.error("Failed to update quiz", err);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      await axiosInstance.delete(`/quiz/quizzes/${quizId}/`);
      navigate(-1); // go back to course content
    } catch (err) {
      console.error("Failed to delete quiz", err);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await axiosInstance.delete(`/quiz/questions/${questionId}/`);
      fetchQuiz(); // refresh questions list
    } catch (err) {
      console.error("Failed to delete question", err);
    }
  };

  const canEdit = courseStatus === "draft";

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-8">

      <div className="bg-white shadow rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">{quiz?.title}</h1>

        <div className="flex gap-6 text-sm text-gray-600">
          <span>Pass %: {quiz?.pass_percentage}</span>
          <span>Max Attempts: {quiz?.max_attempts}</span>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleEditQuiz}
            disabled={!canEdit}
            className={`px-4 py-2 text-white rounded-lg ${
              canEdit ? "bg-blue-600" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Edit Quiz
          </button>

          <button
            onClick={handleEditQuiz}
            disabled={!canEdit}
            className={`px-4 py-2 text-white rounded-lg ${
              canEdit ? "bg-blue-600" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Delete Quiz
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Questions</h2>

          <button onClick={() => { setSelectedQuestion(null); setShowModal(true); }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            + Add Question
          </button>
        </div>

        <div className="space-y-4">
          {quiz?.questions?.map((question) => (
            <div
              key={question.id}
              className="border rounded-xl p-4 space-y-2"
            >
              <div className="flex justify-between">
                <h3 className="font-medium">
                  {question.text} ({question.marks} marks)
                </h3>
                
                {canEdit && (
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedQuestion(question); setShowModal(true); }}  className="text-blue-600 text-sm">
                      Edit
                    </button>

                    <button onClick={()=>handleDeleteQuestion(question.id)} className="text-red-600 text-sm">
                      Delete
                    </button>
                  </div>
                )}  
              </div>

              <ul className="pl-5 list-disc text-sm text-gray-700">
                {question.options.map((option) => (
                  <li
                    key={option.id}
                    className={
                      option.is_correct
                        ? "text-green-600 font-medium"
                        : ""
                    }
                  >
                    {option.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          Student Attempts
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Student</th>
              <th>Attempt</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.id} className="border-b">
                <td className="py-2">{attempt.user_email}</td>
                <td>{attempt.attempt_number}</td>
                <td>{attempt.score}</td>
                <td>{attempt.percentage}%</td>
                <td>
                  <span
                    className={
                      attempt.is_passed
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {attempt.is_passed ? "Passed" : "Failed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
