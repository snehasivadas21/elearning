import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import CourseModal from "../../components/admin/CourseModal";
import { extractResults } from "../../api/api"; 
import { toast } from "react-toastify";
import Pagination from "../../components/ui/Pagination";

const InstructorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("Add");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus,setSearchStatus] = useState("")
  const [page,setPage] = useState(1);
  const [count,setCount] = useState(0);

  const navigate = useNavigate();
  
  const fetchCourses = async () => {
    try {
      const res = await axiosInstance.get("/instructor/courses/",{
        params:{page}
      });
      setCourses(extractResults(res));
      setCount(res.data.count);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page]);


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

  const handleModalSubmit = async (formData, id) => {
    try {
      if (id) {
        await axiosInstance.put(`/instructor/courses/${id}`, formData);
        toast.success("Course updated successfully!");
      } else {
        await axiosInstance.post("/instructor/courses/", formData);
        toast.success("Course created successfully!");
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save course");
    }
  };

  const handleSubmitForReview = async (id) => {
    try {
      await axiosInstance.post(`/instructor/courses/${id}/`, {
        status: "submitted",
      });
      toast.success("Course submitted for review!");
      fetchCourses();
    } catch (error) {
      console.error("Submit for review error:", error);
      toast.error("Failed to submit for review");
    }
  };

  const renderActions = (course) => {
    switch(course.status){
      case "draft":
        return (
          <>
          <button onClick={()=>handleEdit(course)} className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-purple-700">
            Edit
          </button>
          <button onClick={()=>navigate(`/tutor/courses/${course.id}/content`)} className="px-4 py-2 bg-purple-600 text-white rounded">
            Manage Content
          </button>
          <button onClick={()=>handleSubmitForReview(course.id)} className="px-4 py-2 bg-red-500 text-white rounded">
            Submit for Review
          </button>
          </>
        )
      case "submitted":
        return (
          <button onClick={()=>navigate(`/tutor/courses/${course.id}`)} className="px-4 py-2 bg-purple-600 text-white rounded">
            View Details
          </button>
        ) 
      case "approved":
        return (
          <>
          <button onClick={()=>navigate(`/tutor/courses/${course.id}/content`)} className="px-4 py-2 bg-blue-400 text-white rounded">
            Manage Content
          </button>
          <button onClick={()=>navigate(`/courses/${course.id}`)} className="px-4 py-2 bg-purple-600 text-white rounded">
            View Course
          </button>
          </>
        ) 
      case "rejected":
        return (
          <>
          <button onClick={()=>navigate(`/tutor/courses/${course.id}`)} className="px-4 py-2 bg-purple-600 text-white rounded">
            View Feedback
          </button>
          <button onClick={()=>handleEdit(course)} className="px-4 py-2 bg-yellow-400 text-white rounded">
            Edit & Resubmit
          </button>
          </>
        )  
      default:
        return null;    
    }
  }

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

      <input
        type="text"
        placeholder="Search by title/category"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
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
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-lg">{course.title}</h3>
              {statusBadge(course.status)}
            </div>

            <p className="text-sm text-gray-600 mb-2">
              {course.category_name} • {course.level}
            </p>

            <p className="font-medium mb-4">₹ {course.price}</p>

            <div className="flex flex-wrap gap-2">{renderActions(course)}</div>
          </div>
        ))}
      </div>
              <div className="flex flex-wrap gap-2 mt-4">
                
                {["draft", "rejected"].includes(course.status) && (
                  <button
                    onClick={() => handleEdit(course)}
                    className="px-3 py-1 bg-blue-500 text-white rounded"
                  >
                    Edit
                  </button>
                )}

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
                    disabled={submittingId === course.id}
                    onClick={() => handleSubmitForReview(course.id)}
                    className={`px-3 py-1 rounded text-white
                      ${submittingId === course.id
                        ? "bg-yellow-300 cursor-not-allowed"
                        : "bg-yellow-500"}
                    `}
                  >
                    {submittingId === course.id ? "Submitting..." : "Submit for Review"}
                  </button>
                )}

                <button
                  onClick={() => navigate(`/tutor/courses/${course.id}`)}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  View Details
                </button>
                
              </div>
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
          mode={modalMode}
        />
      )}

      <Pagination
        page={page}
        setPage={setPage}
        count={count}
      />
    </div>
  );
};

export default InstructorCourses;