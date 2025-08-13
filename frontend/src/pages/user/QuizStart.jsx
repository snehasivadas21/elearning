import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance';
import QuizQuestionCard from '../../components/user/QuizQuestionCard';

const QuizStart = () => {
    const {quizId} =useParams();
    const navigate = useNavigate();

    const [quizData,setQuizData] =useState(null)
    const [currentIndex,setCurrentIndex] =useState(0)
    const [answers,setAnswers] = useState({})
    const [loading,setLoading] = useState(true);
    const [timer,setTimer] = useState(600)

    useEffect(()=>{
        const fetchQuiz = async () => {
            try {
                const res = await axiosInstance.get(`/quizzes/${quizId}`);
                setQuizData(res.data);
            } catch (error) {
                console.error('Failed to fetch quiz:',error);
            } finally {
                setLoading(false);
            }
        }
        fetchQuiz();
    },[quizId])

    useEffect(()=>{
        const interval = setInterval(() => {
            setTimer(prev=>{
                if (prev <= 1){
                    clearInterval(interval);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            })   
        }, 1000);
        return () => clearInterval(interval);
    },[])

    const handleSelect = (choiceId) => {
        const currentQ = quizData.questions[currentIndex]
        setAnswers(prev=>({
            ...prev,
            [currentQ.id]: choiceId
        }))
    }

    const handlePrevious = () =>{
        if (currentIndex > 0) setCurrentIndex(prev=>prev -1)
    }

    const handleNext = () => {
        if (currentIndex < quizData.questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
        }
    }

    const handleSubmit = async () =>{
        const payload = {
            quiz : quizData.id,
            answers : Object.entries(answers).map(([questionId,choiceId])=>({
                question : parseInt(questionId),
                selected_choice:choiceId
            }))
        }
        try {
            await axiosInstance.post('/submit/',payload);
            navigate(`/quiz/${quizId}/result`);
        } catch (error) {
            console.error('Submission error:',err);
        }
    }

    const formatTime = (secs) => {
        const min = Math.floor(secs / 60).toString().padStart(2, '0');
        const sec = (secs % 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!quizData) return <div className="p-8 text-center">Quiz not found.</div>;

    const currentQ = quizData.questions[currentIndex];
    const progress = ((currentIndex + 1) / quizData.questions.length) * 100;

    
  return (
    <div className='max-w-4xl mx-auto p-4'>
        <div className='bg-white p-4 rounded-xl shadow flex justify-between items-center mb-6'>
            <div>
                <h1 className='text-xl font-semibold'>📕{quizData.title}</h1>
                <p className='text-sm text-gray-500'>
                    Question {currentIndex+1} of {quizData.questions.length}
                </p>
            </div>
            <div className='flex items-center gap-2'>
                <span className='text-red-500 font-semibold'>⏰{formatTime(timer)}</span>
                <button className='text-sm text-gray-500 underline' onClick={()=>window.location.reload()}>
                    Reset
                </button>
            </div>
        </div>
        <div className='w-full bg-gray-200 h-2 rounded-full mb-6'>
            <div className='bg-blue-600 h-2 rounded-full' style={{width:`${progress}%`}}></div>
        </div>

        <QuizQuestionCard
         question = {currentQ}
         selectedChoiceId={answers[currentQ.id]}
         onSelect={handleSelect}
        />

        <div className='flex justify-between mt-8'>
            <button
              className='bg-gray-200 px-4 py-2 rounded-lg'
              disabled = {currentIndex === 0}
              onClick={handlePrevious}
            >
               Previous
            </button>
            {currentIndex < quizData.questions.length -1 ? (
                <button className='bg-blue-600 text-white px-6 py-2 rounded-lg' onClick={handleNext}>
                  Next  
                </button>
            ):(
                <button className='bg-green-500 text-white px-6 py-2 rounded-lg flex items-center gap-2' onClick={handleSubmit}>
                    🏆 Finish Quiz
                </button>
            )}
        </div>
      
    </div>
  )
}

export default QuizStart