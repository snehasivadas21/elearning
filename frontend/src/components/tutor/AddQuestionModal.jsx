import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

export default function AddQuestionModal({ quizId, onClose, onSuccess, questionData }) {

  const isEditing = !!questionData;

  const [text, setText] = useState("");
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState([
    { text: "", is_correct: false },
    { text: "", is_correct: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (questionData) {
      setText(questionData.text);
      setMarks(questionData.marks);
      setOptions(questionData.options.map((opt) => ({
        text: opt.text,
        is_correct: opt.is_correct,
      })));
    }
  }, [questionData]);

  const handleOptionChange = (index, field, value) => {
    const updated = [...options];
    updated[index][field] = value;
    setOptions(updated);
  };

  const handleCorrectSelect = (index) => {
    const updated = options.map((opt, i) => ({
      ...opt,
      is_correct: i === index,
    }));
    setOptions(updated);
  };

  const addOption = () => {
    setOptions([...options, { text: "", is_correct: false }]);
  };

  const removeOption = (index) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  const handleSubmit = async () => {
    setError("");

    if (!text.trim()) {
      return setError("Question text is required.");
    }

    if (options.some((opt) => !opt.text.trim())) {
      return setError("All options must have text.");
    }

    const correctCount = options.filter((opt) => opt.is_correct).length;
    if (correctCount !== 1) {
      return setError("Select exactly one correct answer.");
    }

    try {
      setLoading(true);

      if (isEditing) {
        await axiosInstance.patch(`/quiz/questions/${questionData.id}/`, {
          text,
          marks,
          options,
        });
      } else {
        await axiosInstance.post(`/quiz/quizzes/${quizId}/add-question/`, {
          text,
          marks,
          options,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(isEditing ? "Failed to update question." : "Failed to add question.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-6 space-y-6 shadow-lg">

        <h2 className="text-xl font-semibold">
          {isEditing ? "Edit Question" : "Add Question"} 
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded">
            {error}
          </div>
        )}

        {/* Question Text */}
        <div>
          <label className="block mb-1 text-sm font-medium">
            Question Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border rounded-lg p-2"
            rows={3}
          />
        </div>

        {/* Marks */}
        <div>
          <label className="block mb-1 text-sm font-medium">
            Marks
          </label>
          <input
            type="number"
            value={marks}
            min={1}
            onChange={(e) => setMarks(Number(e.target.value))}
            className="w-32 border rounded-lg p-2"
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Options
          </label>

          {options.map((option, index) => (
            <div
              key={index}
              className="flex items-center gap-3"
            >
              <input
                type="radio"
                name="correctOption"
                checked={option.is_correct}
                onChange={() => handleCorrectSelect(index)}
              />

              <input
                type="text"
                value={option.text}
                onChange={(e) =>
                  handleOptionChange(index, "text", e.target.value)
                }
                className="flex-1 border rounded-lg p-2"
                placeholder={`Option ${index + 1}`}
              />

              {options.length > 2 && (
                <button
                  onClick={() => removeOption(index)}
                  className="text-red-600 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addOption}
            className="text-blue-600 text-sm"
          >
            + Add Option
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            {loading ? "Saving..." : isEditing ? "Update Question" : "Save Question"}
          </button>
        </div>

      </div>
    </div>
  );
}