import { useEffect, useState } from "react";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

export default function Analytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/applications/dashboard/")
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!stats) return <p>Loading...</p>;

  const pieData = [
    { name: "Applicants", value: stats.total_applicants },
    { name: "Shortlisted", value: stats.shortlisted_count },
    { name: "Hired", value: stats.hired_count },
  ];
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <Card><CardContent><h2>Total Jobs</h2><p>{stats.total_jobs}</p></CardContent></Card>
      <Card><CardContent><h2>Total Applicants</h2><p>{stats.total_applicants}</p></CardContent></Card>
      <Card><CardContent><h2>Hired</h2><p>{stats.hired_count}</p></CardContent></Card>

      <Card className="col-span-1 md:col-span-2">
        <CardContent>
          <h2>Applicants Status</h2>
          <PieChart width={300} height={200}>
            <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-3">
        <CardContent>
          <h2>Recent Applicants</h2>
          <ul>
            {stats.recent_applicants.map(app => (
              <li key={app.id}>
                {app.student} applied for {app.job} ({app.status})
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
