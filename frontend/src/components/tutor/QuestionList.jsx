export default function QuestionList({ quiz }) {
  if (!quiz) return <p>Loading...</p>;

  if (!quiz.questions.length)
    return <p className="text-gray-500">No questions added yet.</p>;

  return (
    <div className="space-y-4">
      {quiz.questions.map((q, index) => (
        <div key={q.id} className="p-4 border rounded">
          <h4 className="font-semibold">
            {index + 1}. {q.text}
          </h4>

          <ul className="mt-2 ml-4 list-disc">
            {q.options.map((opt) => (
              <li
                key={opt.id}
                className={opt.is_correct ? "text-green-600 font-medium" : ""}
              >
                {opt.text}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}