import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

const MyQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axiosInstance.get('/quiz/quiz-progress/');
        setQuizzes(res.data);
      } catch (err) {
        console.error('Error fetching quiz progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading quizzes...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📋 My Quiz Attempts</h1>

      {quizzes.length === 0 ? (
        <p className="text-gray-600">You haven't submitted any quizzes yet.</p>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{quiz.quiz_title}</h2>
                <p className="text-sm text-gray-500">
                  Submitted on {new Date(quiz.submitted_at).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-blue-600 font-bold text-lg">{quiz.score}%</span>
                <span className={`text-sm font-medium ${quiz.passed ? 'text-green-600' : 'text-red-500'}`}>
                  {quiz.passed ? 'Passed' : 'Failed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQuizzes;