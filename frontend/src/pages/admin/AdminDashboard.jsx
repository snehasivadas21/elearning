import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axiosInstance.get("/admin/dashboard/")
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        console.error("Dashboard error:", err);
      });
  }, []);

  if (!data) return <div>Loading...</div>;

  const revenueData = data.monthly_revenue.map(item => ({
    month: new Date(item.month).toLocaleString("default", { month: "short" }),
    total: item.total
  }));

  const userMap = {};

  data.monthly_users.forEach(item => {
    const month = new Date(item.month).toLocaleString("default", { month: "short" });

    if (!userMap[month]) {
      userMap[month] = { month, students: 0, instructors: 0 };
    }

    if (item.role === "student") {
      userMap[month].students = item.count;
    } else if (item.role === "instructor") {
      userMap[month].instructors = item.count;
    }
  });

  const userData = Object.values(userMap);

  const courseData = data.monthly_courses.map(item => ({
    month: new Date(item.month).toLocaleString("default", { month: "short" }),
    count: item.count
  }));

  return (
    <div style={{ padding: "20px" }}>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">Admin Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">👩‍🎓 Total Students</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">
            {data.stats.total_students}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">🎓 Total Instructors</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">
           {data.stats.total_instructors}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">📚 Total Courses</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">
           {data.stats.total_courses}
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">💰 Total Revenue</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-2">
           ₹ {data.stats.total_revenue}
          </h3>
        </div>

      </div>

      <div style={{ width: "100%", height: 350, marginBottom: 40 }}>
        <h4 className="text-xl font-semibold">Monthly Revenue</h4>
        <ResponsiveContainer>
          <AreaChart data={revenueData}>
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

      <div style={{ width: "100%", height: 300, marginBottom: 40 }}>
        <h4 className="text-xl font-semibold">User Growth</h4>
        <ResponsiveContainer>
          <BarChart data={userData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="students" fill="#3b82f6" name="Students" />
            <Bar dataKey="instructors" fill="#10b981" name="Instructors" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <h4 className="text-xl font-semibold">Course Creation Trend</h4>
        <ResponsiveContainer>
          <LineChart data={courseData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}