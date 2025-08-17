import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import CourseModal from "../../components/admin/CourseModal"; 
import InstructorLiveSessionPanel from "../../components/tutor/InstructorLivePanel";

const InstructorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("Add");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axiosInstance.get("/courses/instructor/courses/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setCourses(data);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
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

  // Safe filter
  const filteredCourses = Array.isArray(courses)
    ? courses.filter((course) =>
        course.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
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
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-6 border px-3 py-2 rounded w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      {/* Courses Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Course Info */}
              <div>
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <p className="text-gray-700 mb-1">
                  Category: {course.category_name || course.category || "N/A"}
                </p>
                <p className="text-gray-700 mb-1">
                  {course.is_free ? "Free" : `Price: ₹${course.price}`}
                </p>
                <p className="text-gray-500 mb-1 capitalize">
                  Status:{" "}
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
                </p>
                <p className="text-gray-500 mb-1">
                  Active: {course.is_active ? "Yes" : "No"}
                </p>
                {course.course_image ? (
                  <img
                    src={course.course_image}
                    alt="Course"
                    className="w-full h-40 object-cover rounded mt-2"
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded mt-2">
                    No Image
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() =>
                    navigate(`/tutor/chat/${course.id}`, { state: { roomName: course.title } } , {state : {role : "instructor" }})
                  }
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Chat
                </button>

                <button
                  onClick={() => handleEdit(course)}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                >
                  Edit
                </button>

                {course.status !== "rejected" && (
                  <button
                    onClick={() =>
                      navigate(`/tutor/courses/${course.id}/content`)
                    }
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                  >
                    Manage Content
                  </button>
                )}
                <InstructorLiveSessionPanel course={course} />
                
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full">No courses found.</p>
        )}
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
