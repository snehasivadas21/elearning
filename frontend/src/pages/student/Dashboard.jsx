import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function StudentDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/users/dashboard/")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Student dashboard error:", err));
  }, []);

  if (!data) return <div>Loading...</div>;

  // 🔹 Pie Chart Data
  const pieData = [
    { name: "Completed", value: data.stats.completed },
    { name: "Ongoing", value: data.stats.ongoing },
  ];

  const COLORS = ["#26b910", "#f6ab3b"];

  // 🔹 Progress Per Course
  const progressData = data.progress_per_course.map((item) => ({
    course: item.course_title,
    progress: item.progress,
  }));

  return (
    <div style={{ padding: "20px" }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">Student Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Total Enrolled</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">
            {data.stats.total_enrolled}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Completed</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">
           {data.stats.completed}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">Ongoing</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">
           {data.stats.ongoing}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Certificates</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">
           {data.stats.certificates}
          </h3>
        </div>

      </div>

      {/* ===== Completion Pie Chart ===== */}
      <div style={{ width: "100%", height: 300, marginBottom: 40 }}>
        <h4 className="text-xl font-semibold">Course Completion Overview</h4>
        <ResponsiveContainer>
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ===== Progress Per Course ===== */}
      <div style={{ width: "100%", height: 300 }}>
        <h4 className="text-xl font-semibold">Progress Per Course (%)</h4>
        <ResponsiveContainer>
          <BarChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="course" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Bar dataKey="progress" fill="#6366f1" name="Completion %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}