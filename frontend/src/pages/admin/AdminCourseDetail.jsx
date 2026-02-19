import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import CourseDetail from "../tutor/CourseDetail";
import { extractResults } from "../../api/api";
import { toast } from "react-toastify";

const AdminCourseDetail = () => {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCourse = async () => {
    try {
        const [courseRes, modulesRes] = await Promise.all([
          axiosInstance.get(`/admin/courses/${id}/`),
          axiosInstance.get(`/modules/?course=${id}`)
        ]);

        setCourse({
          ...courseRes.data,
          modules: extractResults(modulesRes),
        });
      } catch (err) {
        console.error(err);
      } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const handleAction = async (action) => {
    if (action === "reject" && !feedback.trim()) {
      toast.error("Feedback is required for rejection");
      return;
    }

    setActionLoading(true);
    try {
      await axiosInstance.patch(
        `/admin/courses/${course.id}/${action}/`,
        { admin_feedback: feedback }
      );
      fetchCourse(); 
    } catch (err) {
      console.error("Admin action failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!course) return <p className="p-6 text-red-600">Course not found</p>;

  return (
    <div className="space-y-10 pb-10">

      <CourseDetail course={course} role="admin"/>

      {course.status === "submitted" && (
        <div className="max-w-6xl mx-auto bg-white border rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Admin Review Panel
          </h3>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Admin feedback (required for rejection)"
            className="w-full border rounded p-3 mb-4"
          />

          <div className="flex gap-4">
            <button
              disabled={actionLoading}
              onClick={() => handleAction("approve")}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
             ✓ Approve Course
            </button>

            <button
              disabled={actionLoading}
              onClick={() => handleAction("reject")}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              ✗ Reject Course
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourseDetail;
