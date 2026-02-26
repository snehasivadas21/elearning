import { useEffect, useState } from "react";
import axiosinstance from "../../api/axiosInstance";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function TutorDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axiosinstance
      .get("/tutor/dashboard/")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Tutor dashboard error:", err));
  }, []);

  if (!data) return <div>Loading...</div>;

  // 🔹 Format Monthly Earnings
  const earningsData = data.monthly_earnings.map((item) => ({
    month: new Date(item.month).toLocaleString("default", {
      month: "short",
    }),
    total: item.total,
  }));

  // 🔹 Format Students Per Course
  const studentsData = data.students_per_course.map((item) => ({
    course: item.course__title,
    count: item.count,
  }));

  // 🔹 Format Revenue Per Course
  const revenueData = data.revenue_per_course.map((item) => ({
    course: item.course__title,
    total: item.total,
  }));

  return (
    <div style={{ padding: "20px" }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">Tutor Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">👩‍🎓 Total Students</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">
            {data.stats.total_students}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">📚 Total Courses</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">
           {data.stats.total_courses}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">💰 Total Earnings</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">
           ₹ {data.stats.total_earnings}
          </h3>
        </div>

      </div>

      {/* ===== Monthly Earnings ===== */}
      <div style={{ width: "100%", height: 350, marginBottom: 40 }}>
        <h4 className="text-xl font-semibold">Monthly Earnings</h4>
        <ResponsiveContainer>
          <AreaChart data={earningsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value}`} />
            <Legend />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#4f46e5"
              fill="#c7d2fe"
              strokeWidth={2}
              name="Earnings"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ===== Students Per Course ===== */}
      <div style={{ width: "100%", height: 300, marginBottom: 40 }}>
        <h4 className="text-xl font-semibold">Students Per Course</h4>
        <ResponsiveContainer>
          <BarChart data={studentsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="course" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Students" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== Revenue Per Course ===== */}
      <div style={{ width: "100%", height: 300 }}>
        <h4 className="text-xl font-semibold">Revenue Per Course</h4>
        <ResponsiveContainer>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="course" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value}`} />
            <Legend />
            <Bar dataKey="total" fill="#10b981" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
