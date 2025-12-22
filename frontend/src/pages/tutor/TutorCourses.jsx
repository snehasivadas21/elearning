import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import CourseModal from "../../components/admin/CourseModal"; 
import { toast } from "react-toastify";

const InstructorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("Add");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  
  const fetchCourses = async () => {
    try {
      const res = await axiosInstance.get("/instructor/courses/");
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);


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
      await axiosInstance.p(`/instructor/courses/${id}/`, {
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
          <button onClick={()=>handleEdit(course)} className="btn-secondary">
            Edit
          </button>
          <button onClick={()=>navigate(`/instructor/courses/${course.id}/content`)} className="btn-primary">
            Manage Content
          </button>
          <button onClick={()=>handleSubmitForReview(course.id)} className="btn-warning">
            Submit for Review
          </button>
          </>
        )
      case "submitted":
        return (
          <button onClick={()=>navigate(`/instructor/courses/${course.id}`)} className="btn-secondary">
            View Details
          </button>
        ) 
      case "approved":
        return (
          <>
          <button onClick={()=>navigate(`/instrucor/courses/${course.id}/content`)} className="btn-primary">
            Manage Content
          </button>
          <button onClick={()=>navigate(`/courses/${course.id}`)} className="btn-secondary">
            View Course
          </button>
          </>
        ) 
      case "rejected":
        return (
          <>
          <button onClick={()=>navigate(`/instructor/courses/${course.id}`)} className="btn-secondary">
            View Feedback
          </button>
          <button onClick={()=>handleEdit(course)} className="btn-warning">
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

  // const filteredCourses = Array.isArray(courses)
  //   ? courses.filter((course) =>
  //       course.title?.toLowerCase().includes(searchQuery.toLowerCase())
  //     )
  //   : [];

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold text-purple-600">My Courses</h2>
//         <button
//           onClick={handleAdd}
//           className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
//         >
//           + Add Course
//         </button>
//       </div>

//       <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
//         {filteredCourses.length > 0 ? (
//           filteredCourses.map((course) => (
//             <div
//               key={course.id}
//               className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
//             >
//               <div>
//                 <h3 className="text-xl font-bold mb-2">{course.title}</h3>
//                 <p className="text-gray-700 mb-1">
//                   Category: {course.category_name || course.category || "N/A"}
//                 </p>
//                 <p className="text-gray-700 mb-1">
//                   {course.is_free ? "Free" : `Price: ₹${course.price}`}
//                 </p>
//                 <p className="text-gray-500 mb-1 capitalize">
//                   Status:{" "}
//                   <span
//                     className={`px-2 py-1 rounded-full text-xs font-semibold ${
//                       course.status === "approved"
//                         ? "bg-green-100 text-green-700"
//                         : course.status === "rejected"
//                         ? "bg-red-100 text-red-700"
//                         : course.status === "submitted"
//                         ? "bg-blue-100 text-blue-700"
//                         : "bg-yellow-100 text-yellow-700"
//                     }`}
//                   >
//                     {course.status}
//                   </span>
//                 </p>
//                 <p className="text-gray-500 mb-1">
//                   Active: {course.is_active ? "Yes" : "No"}
//                 </p>
//                 {course.course_image ? (
//                   <img
//                     src={course.course_image}
//                     alt="Course"
//                     className="w-full h-40 object-cover rounded mt-2"
//                   />
//                 ) : (
//                   <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded mt-2">
//                     No Image
//                   </div>
//                 )}
//               </div>

//               <div className="mt-4 flex flex-col gap-2">
//                 <button
//                   onClick={() =>
//                     navigate(`/tutor/chat/${course.id}`, { 
//                       state: { roomName: course.title, role: "instructor" } 
//                     })
//                   }
//                   className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
//                 >
//                   Chat
//                 </button>

//                 <button
//                   onClick={() => handleEdit(course)}
//                   className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
//                   disabled={course.status === "approved"}
//                 >
//                   Edit
//                 </button>

//                 {course.status === "draft" && (
//                   <button 
//                     onClick={() => handleSubmitForReview(course)}
//                     className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
//                   >
//                     Submit for Review
//                   </button>
//                 )}

//                 {course.status !== "rejected" && (
//                   <button
//                     onClick={() =>
//                       navigate(`/tutor/courses/${course.id}/content`)
//                     }
//                     className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
//                   >
//                     Manage Content
//                   </button>
//                 )}
                
//               </div>
//             </div>
//           ))
//         ) : (
//           <p className="text-gray-500 col-span-full">No courses found.</p>
//         )}
//       </div>

//       <CourseModal
//         show={showModal}
//         onClose={() => setShowModal(false)}
//         onSubmit={handleModalSubmit}
//         course={selectedCourse}
//         mode={modalMode}
//         hideStatus={true}
//         defaultStatus="draft"  
//       />
//     </div>
//   );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Courses</h2>
        <button onClick={handleAdd} className="btn-primary">
          + Create Course
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by title"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-6 border px-3 py-2 rounded w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-purple-500"
     />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
            <img
              src={course.course_image}
              alt={course.title}
              className="w-full h-36 object-cover rounded mb-3"
            />

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

      {showModal && (
        <CourseModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleModalSubmit}
          course={selectedCourse}
          mode={modalMode}
        />
      )}
    </div>
  );
};

export default InstructorCourses;