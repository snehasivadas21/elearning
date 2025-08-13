import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";


const AdminCourseApproval = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axiosInstance.get("courses/admin/courses/?status=submitted", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    const token = localStorage.getItem("accessToken");
    try {
      await axiosInstance.patch(
        `courses/admin/courses/${id}/`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCourses(); // refresh
    } catch (err) {
      console.error("Error updating course:", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-purple-600">Course Approvals</h2>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Instructor</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="px-6 py-3">{course.title}</td>
                <td className="px-6 py-3">{course.instructor_username || "N/A"}</td>
                <td className="px-6 py-3">{course.category_name || course.category}</td>
                <td className="px-6 py-3">{course.status}</td>
                <td className="px-6 py-3 space-x-2">
                  <button
                    onClick={() => updateStatus(course.id, "approved")}
                    className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(course.id, "rejected")}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td className="px-6 py-4 text-center text-gray-500" colSpan={5}>
                  No submitted courses.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCourseApproval;