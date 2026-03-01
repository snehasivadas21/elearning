import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StudentPortfolio() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/users/portfolio/")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Portfolio error:", err));
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  const progressChartData = data.courses.map((course) => ({
    name: course.course_title,
    progress: course.progress,
  }));

  return (
    <div className="p-6 space-y-8">

      {/* ===== PROFILE HEADER ===== */}
      <div className="bg-white shadow rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {data.profile.name}
          </h2>
          <p className="text-gray-500">{data.profile.email}</p>
          <p className="text-sm text-gray-400 mt-1">
            Joined: {new Date(data.profile.joined_date).toLocaleDateString()}
          </p>
        </div>

        <div className="mt-4 md:mt-0 bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-semibold">
          Verified Skill Profile
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <KpiCard title="Enrolled" value={data.stats.total_enrolled} />
        <KpiCard title="Completed" value={data.stats.completed} />
        <KpiCard title="Ongoing" value={data.stats.ongoing} />
        <KpiCard title="Certificates" value={data.stats.certificates} />
        <KpiCard title="Overall Quiz %" value={`${data.stats.overall_quiz_average}%`} />
      </div>

      {/* ===== BAR CHART (ONLY ONE) ===== */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4">
          Course Progress Overview (%)
        </h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={progressChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="progress" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== COURSE PERFORMANCE TABLE ===== */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4">Course Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Course</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Quiz Avg %</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.courses.map((course) => (
                <tr key={course.course_id} className="border-t">
                  <td className="p-3">{course.course_title}</td>
                  <td className="p-3">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-purple-600 h-3 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm">{course.progress}%</span>
                  </td>
                  <td className="p-3">{course.quiz_average}%</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        course.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {course.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== CERTIFICATES SECTION ===== */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4">Certificates</h3>

        {data.certificates.length === 0 ? (
          <p className="text-gray-500">No certificates earned yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.certificates.map((cert, index) => (
              <div
                key={index}
                className="border rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-semibold">{cert.course}</h4>
                  <p className="text-sm text-gray-500">
                    Issued: {new Date(cert.issued_at).toLocaleDateString()}
                  </p>
                </div>
                {cert.certificate_url && (
                  <a
                    href={cert.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-purple-600 font-medium"
                  >
                    View Certificate
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}


/* ===== Reusable KPI Card Component ===== */
function KpiCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800 mt-2">{value}</h3>
    </div>
  );
}