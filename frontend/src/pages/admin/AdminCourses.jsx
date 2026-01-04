import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance"; 
import { extractResults } from "../../api/api";

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [showModal,setShowModal] = useState(false);
  const [selectedCourse,setSelectedCourse] = useState(null);
  const [feedback,setFeedback] = useState("");
  const [actionType,setActionType] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axiosInstance.get("/admin/courses/"); 
      setCourses(extractResults(res));
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([])
    }
  };

  const openReviewModal = (course,action) =>{
    setSelectedCourse(course);
    setActionType(action);
    setFeedback("");
    setShowModal(true);
  }

  const submitReview = async()=>{
    try {
      await axiosInstance.patch(
        `admin/courses/${selectedCourse.id}/${actionType}/`,
        {admin_feedback:feedback}
      )
      setShowModal(false)
      fetchCourses(); 
    } catch (err) {
      console.error("Review failed",err)
    }
  };

  const toggleActive = async(course)=>{
    if (!window.confirm("Change course active status?")) return;
    try {
      await axiosInstance.patch(
        `/admin/courses/${course.id}/toggel_active/`
      );
      fetchCourses();
    } catch (err) {
      console.error("Toggle active failed",err) 
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = searchStatus ? course.status === searchStatus : true;

    return matchesSearch && matchesStatus;
});

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">All Courses</h2>
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
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Active</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCourses.map((course,index) => (
              <tr key={course.id} className="border-t">
                <td className="px-6 py-4">{index+1}</td>
                <td className="px-6 py-4">{course.title}</td>
                <td className="px-6 py-4">{course.instructor_username}</td>
                <td className="px-6 py-4">{course.category_name || course.category}</td>
                <td className="px-6 py-4">₹{course.price}</td>
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
                  {course.status === "submitted" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => openReviewModal(course,"approve")}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      ✓ Approve Course
                    </button>
                    <button
                      onClick={() => openReviewModal(course,"reject")}
                      className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      ✗ Reject Course
                    </button>
                  </div>
                  )}

                  <button
                    onClick={() => toggleActive(course)}
                    className={`${
                      course.is_active
                        ? "text-red-600"
                        : "text-green-600"
                    } hover:underline`}
                  >
                    {course.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center ">
          <div className="bg-white p-6 rounded w-96">
            <h3 className="text-lg font-semibold mb-3 capitalize">
              {actionType} Course
            </h3>

            <textarea
              value={feedback}
              onChange={(e)=>setFeedback(e.target.value)}
              placeholder="Admin Feedback"
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <div className="flex justify-end gap-2">
              <button onClick={()=>setShowModal(false)} className="px-4 py-1 border rounded">
                Cancel
              </button>
              <button onClick={submitReview} className="px-4 py-1 bg-purple-600 text-white rounded">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;