import { useEffect, useState, useRef } from "react";
import axiosInstance from "../../api/axiosInstance";
import QuestionCard from "../../components/student/QuestionCard";
import ResultCard from "../../components/student/ResultCard";
import Pagination from "../../components/ui/Pagination";
import { useParams } from "react-router-dom";

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

  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const questionRefs = useRef({});

  const totalPages = Math.ceil(count / 10);

  // Load Quiz
  useEffect(() => {
    const loadData = async () => {
      try {

        const [quizRes, attemptsRes] = await Promise.all([
          axiosInstance.get(`/quiz/quizzes/${quizId}/`),
          axiosInstance.get(`/quiz/quizzes/${quizId}/attempts/`, {
            params: { page },
          }),
        ]);

        setQuiz(quizRes.data);

        setAttempts(attemptsRes.data.results ?? attemptsRes.data);
        setCount(attemptsRes.data.count ?? 0);

      } catch (err) {
        console.error("Failed to load quiz", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [quizId, page]);

  // Select answer
  const handleSelect = (questionId, optionId) => {

    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Scroll to question
  const scrollToQuestion = (id) => {

    questionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // Submit Quiz
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
        `/quiz/quizzes/${quizId}/attempts/`,
        { params: { page } }
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

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions?.length || 0;

  const progress = (answeredCount / totalQuestions) * 100;

  const maxReached = count >= (quiz.max_attempts || 0);
  const alreadyPassed = attempts.some((a) => a.is_passed);

  const allAnswered =
    quiz.questions &&
    Object.keys(answers).length === quiz.questions.length;

  const chartData = attempts.map((a) => ({
    attempt: `Attempt ${a.attempt_number}`,
    percentage: a.percentage,
  }));

  return (
    <div className="flex gap-6 p-6">

      {/* Sidebar Navigation */}

      <div className="w-64 sticky top-6 h-fit bg-white shadow rounded-xl p-4">

        <h3 className="font-semibold mb-4">
          Questions
        </h3>

        <div className="grid grid-cols-5 gap-2">

          {quiz.questions.map((q, index) => {

            const answered = answers[q.id];

            return (
              <button
                key={q.id}
                onClick={() => scrollToQuestion(q.id)}
                className={`h-9 rounded-lg text-sm font-medium transition
                  
                  ${answered
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                  }
                `}
              >
                {index + 1}
              </button>
            );
          })}

        </div>

        <div className="mt-6 text-sm text-gray-600">

          <p>
            Answered: {answeredCount}/{totalQuestions}
          </p>

        </div>

      </div>

      {/* Main Content */}

      <div className="flex-1 space-y-6">

        {/* Header */}

        <div className="bg-white shadow rounded-2xl p-6 flex justify-between items-center">

          <div>
            <h1 className="text-2xl font-bold">
              {quiz.title}
            </h1>

            <p className="text-gray-500 text-sm">
              {quiz.questions.length} Questions
            </p>
          </div>

          <div className="flex gap-8 text-sm">

            <div className="text-center">
              <p className="text-gray-500">Pass</p>
              <p className="font-semibold">{quiz.pass_percentage}%</p>
            </div>

            <div className="text-center">
              <p className="text-gray-500">Attempts</p>
              <p className="font-semibold">{quiz.max_attempts}</p>
            </div>

          </div>

        </div>

        {/* Progress */}

        <div className="bg-white shadow rounded-xl p-4">

          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{answeredCount}/{totalQuestions}</span>
          </div>

          <div className="w-full bg-gray-200 h-2 rounded-full">

            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />

          </div>

        </div>

        {/* Questions */}

        {quiz.questions.map((question) => (

          <div
            key={question.id}
            ref={(el) => (questionRefs.current[question.id] = el)}
          >

            <QuestionCard
              question={question}
              selected={answers[question.id]}
              onSelect={handleSelect}
            />

          </div>

        ))}

        {/* Submit */}

        <div className="sticky bottom-4 flex justify-end">

          <button
            onClick={handleSubmit}
            disabled={!allAnswered || maxReached || alreadyPassed || submitting}
            className={`px-8 py-3 rounded-xl shadow-lg transition
              
              ${!allAnswered || maxReached || alreadyPassed || submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
              }
            `}
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

        {/* Attempt History */}

        <div className="bg-white shadow rounded-2xl p-6">

          <h2 className="text-xl font-semibold mb-4">
            Attempt History
          </h2>

          {attempts.length > 0 && (

            <div className="mb-6">

              <h3 className="text-lg font-semibold mb-3">
                Performance Trend
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

          {/* Table */}

          <div className="overflow-x-auto">

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

                  <tr key={attempt.id}>

                    <td className="p-3">{attempt.attempt_number}</td>
                    <td className="p-3">{attempt.score}</td>
                    <td className="p-3">{attempt.percentage}%</td>

                    <td className="p-3">

                      {attempt.is_passed ? (

                        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                          Passed
                        </span>

                      ) : (

                        <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                          Failed
                        </span>

                      )}

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

      </div>

      {/* Result Modal */}

      {showResultModal && result && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowResultModal(false)}
        >

          <div
            className="relative bg-white p-8 rounded-2xl shadow-xl w-[520px]"
            onClick={(e) => e.stopPropagation()}
          >

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