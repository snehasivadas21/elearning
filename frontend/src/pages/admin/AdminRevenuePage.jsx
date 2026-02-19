import { useEffect, useState } from "react";
import {
  getRevenueSummary,
  getRevenueByCourse,
  getRevenueByInstructor,
} from "../../api/adminRevenue";

import AdminRevenueSummary from "../../components/admin/AdminRevenueSummary";
import RevenueByCourseTable from "../../components/admin/RevenueByCourseTable";
import RevenueByInstructorTable from "../../components/admin/RevenueByInstructorTable";

const AdminRevenuePage = () => {
  const [summary, setSummary] = useState(null);
  const [byCourse, setByCourse] = useState([]);
  const [byInstructor, setByInstructor] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getRevenueSummary(),
      getRevenueByCourse(),
      getRevenueByInstructor(),
    ]).then(([summaryRes, courseRes, instructorRes]) => {
      setSummary(summaryRes.data);
      setByCourse(courseRes.data);
      setByInstructor(instructorRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading revenue...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">Revenue</h2>
      </div>

      <AdminRevenueSummary data={summary} />
      <RevenueByInstructorTable data={byInstructor} />
      <RevenueByCourseTable data={byCourse} />
     
    </div>
  );
};

export default AdminRevenuePage;
