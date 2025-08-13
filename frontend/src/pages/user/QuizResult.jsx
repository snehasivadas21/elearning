import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const QuizResult = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await axiosInstance.get('/quiz-progress/');
        const filtered = res.data.find(sub => sub.quiz_title && sub.quiz === parseInt(quizId));
        setResult(filtered);
      } catch (err) {
        console.error('Failed to load result', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [quizId]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!result) return <div className="p-8 text-center">Result not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow mt-10 text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">🎉 Quiz Completed</h1>
      <p className="text-gray-600 mb-6">You attempted <strong>{result.quiz_title}</strong></p>

      <div className="text-lg font-medium text-gray-700 mb-4">
        Score: <span className="text-blue-600 font-bold">{result.score}%</span>
      </div>

      <div className={`text-lg font-semibold ${
        result.passed ? 'text-green-600' : 'text-red-600'
      }`}>
        {result.passed ? '✅ You Passed!' : '❌ You Failed'}
      </div>

      <p className="text-sm text-gray-500 mt-4">Submitted at: {new Date(result.submitted_at).toLocaleString()}</p>

      <button
        onClick={() => navigate('/dashboard/my-quizzes')}
        className="mt-6 px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
      >
        Go to My Quizzes
      </button>
    </div>
  );
};

export default QuizResult;