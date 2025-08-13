import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import CourseModal from "../../components/admin/CourseModal"; 
import { Link } from "react-router-dom";

const InstructorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("Add");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axiosInstance.get("/courses/instructor/courses/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data);
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
    if (course.status === "approved") {
      alert("Approved courses cannot be edited.");
      return;
    }
    setSelectedCourse(course);
    setModalMode("Edit");
    setShowModal(true);
  };

  const handleModalSubmit = async (formData, id = null) => {
    const token = localStorage.getItem("accessToken");
    try {
      if (modalMode === "Add") {
        await axiosInstance.post("courses/instructor/courses/", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await axiosInstance.put(`courses/instructor/courses/${id}/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">My Courses</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          + Add Course
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by title"
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 border px-3 py-2 rounded w-1/3"
      />

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Free/Paid</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Active</th>
              <th className="px-6 py-3">Image</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCourses.map((course) => (
              <tr key={course.id}>
                <td className="px-6 py-4">{course.id}</td>
                <td className="px-6 py-4">{course.title}</td>
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
                <td className="px-6 py-4">
                  {course.course_image ? (
                    <img
                      src={course.course_image}
                      alt="Course"
                      className="w-16 h-12 object-cover rounded"
                    />
                  ) : (
                    "No Image"
                  )}
                </td>
                <td className="flex justify-between px-6 py-4">
                  <button
                    onClick={() => handleEdit(course)}
                    className="text-purple-600 hover:underline"
                  >
                    Edit
                  </button>
                  {course.status !== "rejected" && (
                    <Link
                      to={`/tutor/courses/${course.id}/content`}
                      className="text-purple-600 hover:underline"
                    >
                      Manage Content
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reusing CourseModal */}
      <CourseModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        course={selectedCourse}
        mode={modalMode}
        hideStatus={true}              
        defaultStatus="submitted"      
      />
    </div>
  );
};

export default InstructorCourses;