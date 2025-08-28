import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import CourseModal from "../../components/admin/CourseModal"; 
import { useNavigate } from "react-router-dom";
import { extractResults } from "../../api/api";

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("Add");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState("");

  const navigate = useNavigate()


  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axiosInstance.get("/admin/courses/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(extractResults(res));
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const handleAdd = () => {
    setSelectedCourse(null);
    setModalMode("Add");
    setShowModal(true);
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setModalMode("Edit");
    setShowModal(true);
  };

  const handleModalSubmit = async (formData, id = null) => {
    const token = localStorage.getItem("accessToken");
    try {
      if (modalMode === "Add") {
        await axiosInstance.post("/admin/courses/", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await axiosInstance.put(`/admin/courses/${id}/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      console.error("Error saving course:", err);
    }
  };

  const handleDelete = async (course) => {
    if (!window.confirm("Are you sure to deactivate this course?")) return;
    const token = localStorage.getItem("accessToken");
    try {
      await axiosInstance.patch(
        `/admin/courses/${course.id}/`,
        { is_active: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCourses();
    } catch (err) {
      console.error("Error deleting course:", err);
    }
  };

  const handleActivate = async (course) => {
    const token = localStorage.getItem("accessToken");
    try {
      await axiosInstance.patch(
        `/admin/courses/${course.id}/`,
        { is_active: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCourses();
    } catch (err) {
      console.error("Activation failed:", err);
    }
  }; 

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor_username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = searchStatus ? course.status === searchStatus : true;

    return matchesSearch && matchesStatus;
});

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">All Courses</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          + Add Course
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by title/instructor"
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 border px-3 py-2 rounded w-1/3"
      />
      
      <select
        className="ml-2 border px-2 py-1 rounded"
        onChange={(e) => setSearchStatus(e.target.value)}
      >
        <option value="">All</option>
        <option value="submitted">Submitted</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Instructor</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Free/Paid</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Active</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCourses.map((course) => (
              <tr key={course.id} className="border-t">
                <td className="px-6 py-4">{course.id}</td>
                <td className="px-6 py-4">{course.title}</td>
                <td className="px-6 py-4">{course.instructor_username}</td>
                <td className="px-6 py-4">{course.category_name || course.category}</td>
                <td className="px-6 py-4">{course.is_free ? "Free" : "Paid"}</td>
                <td className="px-6 py-4">
                  {course.is_free ? "-" : `₹${course.price}`}
                </td>
                <td className="px-6 py-4 capitalize">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      course.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : course.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {course.status}
                  </span>
                </td>
                <td className="px-6 py-4">{course.is_active ? "Yes" : "No"}</td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={()=>navigate(`/admin/courses/${course.id}/review`)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg"
                  >
                    Review
                  </button>
                  {!course.is_active ? (
                    <button
                      onClick={() => handleActivate(course)}
                      className="text-green-600 hover:underline"
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDelete(course)}
                      className="text-red-600 hover:underline"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CourseModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        course={selectedCourse}
        mode={modalMode}
      />
    </div>
  );
};

export default AdminCourses;