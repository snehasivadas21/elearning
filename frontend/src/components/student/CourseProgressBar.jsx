const CourseProgressBar = ({ percentage = 0 }) => {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-lg text-gray-500 mb-1">
        <span>Progress</span>
        <span>{percentage}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default CourseProgressBar;
