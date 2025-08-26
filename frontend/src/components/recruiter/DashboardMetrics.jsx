import { useEffect, useState } from "react";
import axios from "@/api/axios"; // your axios instance
import { Card, CardContent } from "@/components/ui/card";

const DashboardMetrics = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get("/recruiter/metrics/");
        setMetrics(response.data);
      } catch (error) {
        console.error("Error fetching recruiter metrics", error);
      }
    };
    fetchMetrics();
  }, []);

  if (!metrics) return <p className="text-center">Loading metrics...</p>;

  const items = [
    { label: "Total Jobs", value: metrics.total_jobs },
    { label: "Active Jobs", value: metrics.active_jobs },
    { label: "Applications", value: metrics.total_applications },
    { label: "Shortlisted", value: metrics.shortlisted },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, idx) => (
        <Card key={idx} className="shadow-md rounded-2xl">
          <CardContent className="p-6 text-center">
            <p className="text-xl font-bold">{item.value}</p>
            <p className="text-gray-600">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardMetrics;
