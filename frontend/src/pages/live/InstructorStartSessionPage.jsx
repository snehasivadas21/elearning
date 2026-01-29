import { useParams } from "react-router-dom";
import axiosPrivate from "../../../api/axiosPrivate";

const InstructorStartSessionPage = () => {
  const { sessionId } = useParams();

  const startSession = async () => {
    try {
      await axiosPrivate.post(`/live/${sessionId}/start/`);
      alert("Session started");
    } catch (err) {
      console.error(err);
      alert("Failed to start session");
    }
  };

  const endSession = async () => {
    try {
      await axiosPrivate.post(`/live/${sessionId}/end/`);
      alert("Session ended");
    } catch (err) {
      console.error(err);
      alert("Failed to end session");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <h1 className="text-xl font-semibold mb-6">
        Instructor Live Controls
      </h1>

      <button
        onClick={startSession}
        className="w-full bg-green-600 text-white py-3 rounded mb-4"
      >
        Start Live Session
      </button>

      <button
        onClick={endSession}
        className="w-full bg-red-600 text-white py-3 rounded"
      >
        End Live Session
      </button>
    </div>
  );
};

export default InstructorStartSessionPage;
