import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import QuestionCard from "../../components/student/QuestionCard";
import ResultCard from "../../components/student/ResultCard";
import { useParams } from "react-router-dom";

export default function StudentQuizPage() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuiz();
    fetchAttempts();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const res = await axiosInstance.get(`/quiz/quizzes/${quizId}/`);
      setQuiz(res.data);
    } catch (err) {
      console.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttempts = async () => {
    const res = await axiosInstance.get(
      `/quiz/quizzes/${quizId}/attempts/`
    );
    setAttempts(res.data);
  };

  const handleSelect = (questionId, optionId) => {
    setAnswers({
      ...answers,
      [questionId]: optionId,
    });
  };

  const handleSubmit = async () => {
    const formattedAnswers = Object.entries(answers).map(
      ([question_id, option_id]) => ({
        question_id,
        option_id,
      })
    );

    try {
      const res = await axiosInstance.post(
        `/quiz/quizzes/${quizId}/submit/`,
        { answers: formattedAnswers }
      );
      setResult(res.data);
    } catch (err) {
      console.error("Submission failed");
    }
  };

  const maxReached = attempts.length >= quiz.max_attempts;
  const alreadyPassed = attempts.some(a => a.is_passed);

  if (loading) return <div className="p-6">Loading...</div>;

  if (result)
    return <ResultCard result={result} />;

  return (
    <div className="p-6 space-y-6">

      <div className="bg-white shadow rounded-2xl p-6">
        <h1 className="text-2xl font-bold">
          {quiz.title}
        </h1>

        <p className="text-sm text-gray-600">
          Pass Percentage: {quiz.pass_percentage}%
        </p>
      </div>

      {quiz.questions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          selected={answers[question.id]}
          onSelect={handleSelect}
        />
      ))}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={maxReached || alreadyPassed}
          className={`px-6 py-2 rounded-lg ${
            maxReached || alreadyPassed
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white"
          }`}
        >
          {alreadyPassed
            ? "Quiz Passed"
            : maxReached
            ? "Max Attempts Reached"
            : "Submit Quiz"}
        </button>
      </div>

      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          Attempt History
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th>Attempt</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.id} className="border-b">
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

    </div>
  );
}