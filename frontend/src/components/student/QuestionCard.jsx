export default function QuestionCard({
  question,
  selected,
  onSelect,
}) {
  return (
    <div className="bg-white shadow rounded-2xl p-6 space-y-3">
      <h3 className="font-medium">
        {question.text} ({question.marks} marks)
      </h3>

      {question.options.map((option) => (
        <label
          key={option.id}
          className="flex items-center gap-3 cursor-pointer"
        >
          <input
            type="radio"
            name={`question-${question.id}`}
            checked={selected === option.id}
            onChange={() =>
              onSelect(question.id, option.id)
            }
          />
          {option.text}
        </label>
      ))}
    </div>
  );
}