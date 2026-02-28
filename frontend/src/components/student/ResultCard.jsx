export default function ResultCard({ result }) {
  return (
    <div className="p-6 flex justify-center">
      <div className="bg-white shadow rounded-2xl p-8 text-center space-y-4 w-full max-w-md">

        <h2 className="text-2xl font-bold">
          Quiz Result
        </h2>

        <p className="text-lg">
          Score: {result.score}
        </p>

        <p className="text-lg">
          Percentage: {result.percentage}%
        </p>

        <p
          className={
            result.is_passed
              ? "text-green-600 font-semibold"
              : "text-red-600 font-semibold"
          }
        >
          {result.is_passed
            ? "Congratulations! You Passed 🎉"
            : "You Failed. Try Again."}
        </p>

      </div>
    </div>
  );
}