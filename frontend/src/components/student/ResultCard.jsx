import { Link } from "react-router-dom"

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
            ? "🎉 Congratulations! You passed and earned your certificate."
            : "You Failed. Try Again."}
        </p>

        {result.is_passed && (
          <div className="pt-4">
            <Link
              to="/student/certificate"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              View Your Certificate
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}