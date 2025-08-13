import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

const UserDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axiosInstance.get("/users/student/dashboard/");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      }
    };

    fetchDashboard();
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 min-h-screen">

      {/* Main Content */}
      <main className="p-6 md:col-span-3">
        <h1 className="text-2xl font-bold mb-4">Welcome, {data.username}!</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-gray-600">📚 Enrolled Courses</p>
            <h2 className="text-2xl font-bold">{data.enrolled_courses}</h2>
          </div>

          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-gray-600">✅ Lessons Completed</p>
            <h2 className="text-2xl font-bold">{data.lessons_completed}</h2>
          </div>

          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-gray-600">📝 Quizzes Taken</p>
            <h2 className="text-2xl font-bold">{data.quizzes_taken}</h2>
            <p className="text-sm text-gray-500 mt-1">Avg Score: {data.average_quiz_score}%</p>
          </div>
        </div>

        {/* Optional: User Info */}
        <div className="mt-8 bg-white rounded shadow p-4">
          <h2 className="text-lg font-bold mb-2">Profile Info</h2>
          <p><strong>Email:</strong> {data.email}</p>
          <p><strong>Phone:</strong> {data.profile.phone || "N/A"}</p>
          <p><strong>DOB:</strong> {data.profile.dob || "N/A"}</p>
          <p><strong>Bio:</strong> {data.profile.bio || "N/A"}</p>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;