import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import QuestionCard from "../../components/student/QuestionCard";
import ResultCard from "../../components/student/ResultCard";
import { useParams } from "react-router-dom";
import Pagination from "../../components/ui/Pagination";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function StudentQuizPage() {
  const { quizId } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [page,setPage] = useState(1);
  const [count,setCount] = useState(0);

  const totalPages = Math.ceil(count / 10); 

  useEffect(() => {
    const loadData = async () => {
      try {
        const [quizRes, attemptsRes] = await Promise.all([
          axiosInstance.get(`/quiz/quizzes/${quizId}/`),
          axiosInstance.get(`/quiz/quizzes/${quizId}/attempts/`)
        ]);

        setQuiz(quizRes.data);
        setAttempts(attemptsRes.data);
      } catch (err) {
        console.error("Failed to load quiz data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [quizId,page]);

  const handleSelect = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const formattedAnswers = Object.entries(answers).map(
      ([question_id, option_id]) => ({
        question_id,
        option_id,
      })
    );

    try {
      setSubmitting(true);

      const res = await axiosInstance.post(
        `/quiz/quizzes/${quizId}/submit/`,
        { answers: formattedAnswers }
      );

      setResult(res.data);
      setShowResultModal(true);
      setAnswers({});

      const attemptsRes = await axiosInstance.get(
        `/quiz/quizzes/${quizId}/attempts/`,{params:{page}}
      );
      setAttempts(attemptsRes.data.results ?? attemptsRes.data);
      setCount(attemptsRes.data.count ?? 0);

    } catch (err) {
      console.error("Submission failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!quiz) return <div className="p-6">Quiz not found.</div>;

  const maxReached = attempts.length >= (quiz.max_attempts || 0);
  const alreadyPassed = attempts.some((a) => a.is_passed);
  const allAnswered =
    quiz.questions &&
    Object.keys(answers).length === quiz.questions.length;

  const chartData = attempts.map((a) => ({
    attempt: `Attempt ${a.attempt_number}`,
    percentage: a.percentage,
  }));

  return (
    <div className="p-6 space-y-6">

      {/* Quiz Header */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>

        <p className="text-sm text-gray-600">
          Pass Percentage: {quiz.pass_percentage}%
        </p>

        <p className="text-sm text-gray-600">
          Max Attempts: {quiz.max_attempts}
        </p>
      </div>

      {/* Questions */}
      {quiz.questions?.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          selected={answers[question.id]}
          onSelect={handleSelect}
        />
      ))}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || maxReached || alreadyPassed || submitting}
          className={`px-6 py-2 rounded-lg transition ${
            !allAnswered || maxReached || alreadyPassed || submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {alreadyPassed
            ? "Quiz Passed"
            : maxReached
            ? "Max Attempts Reached"
            : submitting
            ? "Submitting..."
            : "Submit Quiz"}
        </button>
      </div>

      {/* Attempt History + Chart */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          Attempt History
        </h2>

        {attempts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              Progress Chart
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attempt" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#2563eb"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
              <tr>
                <th className="p-3">Attempt</th>
                <th className="p-3">Score</th>
                <th className="p-3">Percentage</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="border-t">
                  <td className="p-3">{attempt.attempt_number}</td>
                  <td className="p-3">{attempt.score}</td>
                  <td className="p-3">{attempt.percentage}%</td>
                  <td className="p-3">
                    <span
                      className={
                        attempt.is_passed
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
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
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />

      {/* Result Modal */}
      {showResultModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[480px]">

            <button
              onClick={() => setShowResultModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>

            <ResultCard result={result} />
          </div>
        </div>
      )}

    </div>
  );
}