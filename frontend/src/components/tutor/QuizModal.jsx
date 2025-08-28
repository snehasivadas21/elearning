import React, { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosInstance'

const QuizModal = ({ show,onClose,moduleId,quizData=null,onSaved}) => {
    const [formData,setFormData] = useState({
        title:"",
        instructions:"",
        is_active:true,
    })

    const [questions,setQuestions] = useState([])
    const token = localStorage.getItem("accessToken")

    useEffect(()=>{
        if (quizData) {
            setFormData({
                title:quizData.title || "",
                instructions: quizData.instructions || "",
                is_active: quizData.is_active ?? true,
            })
        } else {
            setFormData({title:"",instructions:"",is_active:true})
            setQuestions([]);
        }
    },[quizData]);

    const handleQuizChange = (e) =>{
        const {name,value,type,checked} = e.target;
        setFormData((prev)=>({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))
    };

    const handleAddQuestion = () =>{
        setQuestions([
            ...questions,
            {text:"",order:questions.length+1,choices:[]}
        ])
    }

    const handleQuestionChange = (index,field,value) =>{
        const updated = [...questions]
        updated[index][field] = value;
        setQuestions(updated);
    }

    const handleAddChoice = (qIndex) =>{
        const updated = [...questions]
        updated[qIndex].choices.push({text:"",is_correct:false})
        setQuestions(updated);
    }

    const handleChoiceChange = (qIndex,cIndex,field,value)=>{
        const updated = [...questions]
        if (field === "is_correct"){
            updated[qIndex].choices = updated[qIndex].choices.map((ch,idx)=>({
                ...ch,
                is_correct: idx === cIndex,
            }))
        }else {
            updated[qIndex].choices[cIndex][field] = value; 
        }
        setQuestions(updated);
    }

    const handleRemoveQuestion = (index) =>{
        const updated = [...questions]
        updated.splice(index,1)
        setQuestions(updated);
    }

    const handleRemoveChoice = (qIndex,cIndex) =>{
        const updated = [...questions]
        updated[qIndex].choices.splice(cIndex,1)
        setQuestions(updated);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
              const payload = {
                ...formData,
                module : moduleId,
                status:"draft",
            };
              const res = await axiosInstance.post("/quiz/quizzes/",payload,{
                headers : {Authorization : `Bearer ${token}`},
            });

            const quizId = res.data.id;

            for (const question of questions){
                const qRes = await axiosInstance.post("/quiz/questions/",{
                    quiz:quizId,
                    text:question.text,
                    order:question.order,
                },{
                    headers:{Authorization:`Bearer ${token}`}
                })

            const questionId = qRes.data.id;
            
            for (const choice of question.choices){
                await axiosInstance.post("/quiz/choices/",{
                    question: questionId,
                    text: choice.text,
                    is_correct: choice.is_correct,
                },{
                    headers: {Authorization:`Bearer ${token}`},
                })
            }
            }

            if (onSaved) onSaved();
            onClose();
        } catch (error) {
            console.error("Error saving quiz and question:",error)
        }
    }

    if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">{quizData ? "Edit" : "Add"} Quiz</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            value={formData.title}
            onChange={handleQuizChange}
            placeholder="Quiz Title"
            className="w-full border px-3 py-2 rounded"
            required
          />

          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleQuizChange}
            placeholder="Instructions"
            className="w-full border px-3 py-2 rounded"
            rows={3}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleQuizChange}
            />
            <span>Active</span>
          </label>

          <div>
            <h4 className="font-semibold text-lg mb-2">Questions</h4>
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="border rounded p-4 mb-4 bg-gray-50">
                <div className="flex justify-between">
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => handleQuestionChange(qIndex, "text", e.target.value)}
                    placeholder={`Question ${qIndex + 1}`}
                    className="w-full border px-2 py-1 rounded mb-2"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="text-red-600 ml-2 text-sm"
                  >
                    ❌ Remove
                  </button>
                </div>

                <div className="ml-4">
                  <p className="text-sm font-medium mb-1">Choices:</p>
                  {q.choices.map((choice, cIndex) => (
                    <div key={cIndex} className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) => handleChoiceChange(qIndex, cIndex, "text", e.target.value)}
                        placeholder={`Choice ${cIndex + 1}`}
                        className="border px-2 py-1 rounded w-full"
                        required
                      />
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={choice.is_correct}
                        onChange={() => handleChoiceChange(qIndex, cIndex, "is_correct", true)}
                      />
                      <span className="text-sm">Correct</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChoice(qIndex, cIndex)}
                        className="text-red-500 text-xs"
                      >
                        ❌
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddChoice(qIndex)}
                    className="text-blue-600 text-sm mt-1"
                  >
                    + Add Choice
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              + Add Question
            </button>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-600 text-white rounded"
            >
              Save as Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuizModal