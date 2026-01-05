import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import CourseModal from "../../components/admin/CourseModal";
import { extractResults } from "../../api/api"; 
import { toast } from "react-toastify";
import Pagination from "../../components/ui/Pagination";
import { formatDistanceToNow } from "date-fns"

const InstructorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus,setSearchStatus] = useState("")
  const [page,setPage] = useState(1);
  const [count,setCount] = useState(0);
  const [isLoading,setIsLoading] = useState(false);

  const navigate = useNavigate();
  
  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/instructor/courses/",{
        params:{page}
      });
      setCourses(extractResults(res));
      setCount(res.data.count);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
      toast.error("Faile to load courses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page]);


  const handleAdd = () => {
    setSelectedCourse(null);
    setShowModal(true);
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleModalSubmit = async (formData, id) => {
    try {
      if (id) {
        await axiosInstance.patch(`/instructor/courses/${id}/`, formData);
        toast.success("Course updated successfully!");
      } else {
        await axiosInstance.post("/instructor/courses/", formData);
        toast.success("Course created and submitted for review!");
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      console.error("Save error:", err);
      const message = err?.response?.data?.detail || "Failed to save course";
      toast.error(message);
    } 
  };

  const handleSubmitForReview = async (courseId) => {
      if (!window.confirm("Submit course for admin review?")) return;

      try {
        await axiosInstance.post(`/instructor/courses/${courseId}/submit/`);
        fetchCourses(); 
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to submit");
      }
    };

  const statusBadge = (status) => {
    const map = {
      draft: "bg-gray-200 text-gray-700",
      submitted: "bg-blue-100 text-blue-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${map[status]}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = searchStatus ? course.status === searchStatus : true;

    return matchesSearch && matchesStatus;
});

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

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by title/category"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-3 py-2 rounded w-1/3"
        />
        <select
          className="border px-2 py-1 rounded"
          value={searchStatus}
          onChange={(e) => setSearchStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-20">Loading courses...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20">No courses found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="border rounded-lg p-4 shadow-sm bg-white flex flex-col"
            >
              {course.course_image ? (
                <img
                  src={course.course_image}
                  alt={course.title}
                  className="w-full h-40 object-cover rounded mt-2"
                />
              ) : (
                <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded mt-2">
                  No Image
                </div>
              )}

              <div className="flex justify-between items-center mb-2 mt-2">
                <h3 className="font-semibold text-lg">{course.title}</h3>
                {statusBadge(course.status)}
              </div>

              <p className="text-sm text-gray-600 mb-1">
                {course.category_name} • {course.level}
              </p>

              {course.updated_at && (
                <p className="text-xs text-gray-400 mb-2">
                  Updated {formatDistanceToNow(new Date(course.updated_at))} ago
                </p>
              )}

              <p className="font-medium mb-4">₹ {course.price}</p>

              <div className="flex flex-wrap gap-2 mt-4">
                
                <button
                  onClick={() => handleEdit(course)}
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    navigate(`/tutor/courses/${course.id}/content`)
                  }
                  className="px-3 py-1 bg-purple-600 text-white rounded"
                >
                  Manage Content
                </button>

                {["draft", "rejected"].includes(course.status) && (
                  <button
                    onClick={() => handleSubmitForReview(course.id)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                  >
                    Submit for Review
                  </button>
                )}

                {course.status === "approved" && (
                  <button
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    View Live
                  </button>
                )}
              </div>

              {course.status === "rejected" && course.admin_feedback && (
                <p className="mt-3 text-sm text-red-600">
                  Feedback: {course.admin_feedback}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CourseModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleModalSubmit}
          course={selectedCourse}
          mode={selectedCourse ? "Edit":"Add"}
        />
      )}

      <Pagination page={page} setPage={setPage} count={count} />
    </div>
  );
};

export default InstructorCourses;