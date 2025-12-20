import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

const CourseReviewPage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("access")
  const navigate = useNavigate();

  useEffect(()=>{
    const fetchCourseDetails = async()=>{
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/admin/courses/${courseId}/`,{
          headers:{Authorization:`Bearer ${token}`},
        })
        setCourse(res.data)
      } catch (error) {
        console.error("Error fetching course details:",error);
        toast.error("Failed to load course details.")
      }finally{
        setLoading(false)
      }
    }
    fetchCourseDetails();
  },[courseId,token]);

  const handleReviewAction = async (status) => {
    try {
      await axiosInstance.patch(`/admin/courses/${courseId}/`,{ status },{headers:{Authorization:`Bearer ${token}`}})
      toast.success(`Course ${status} successfully.`)
      navigate("/admin/courses");
    } catch (error) {
      console.error(`Error updating course status:`,error);
      toast.error("Failed to update course status.");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading course details...</div>
      </div>
    );
  }

  if (!course) {
    return <p className="text-red-600">Course not found</p>
  }

  return (
    <div className="p-6 bg-white shadow rounded">

      {/* Course Details */}
      <Card title={course.title}>
        <p><strong>Description:</strong>{course.description}</p>
        <p><strong>Price:</strong>{course.price}</p>
        <p><strong>Status:</strong>{course.status}</p>
        <p><strong>Instructor:</strong>{course.instructor?.username}</p>
      </Card>

        {course.course_image && (
          <img
            src={course.course_image}
            alt="Course"
            className="w-full max-w-md h-48 object-cover rounded mb-4"
          />
        )}
      

      {/* Modules, Lessons, Quizzes */}
      <Card title="Modules">
        {course.modules?.length ? (
          course.modules.map((module, i) => (
            <div key={module.id} className="mb-4 p-3 border rounded">
              <h3 className="font-semibold">
                Module {i + 1}: {module.title}
              </h3>
              <p>{module.description}</p>

              {/* Lessons */}
              <div className="ml-4 mt-2">
                <h4 className="font-medium">Lessons:</h4>
                {module.lessons?.length ? (
                  module.lessons.map((lesson) => (
                    <div key={lesson.id} className="ml-4">
                      <p>- {lesson.title} ({lesson.content_type})</p>
                    </div>
                  ))
                ) : (
                  <p className="ml-4 italic">No lessons</p>
                )}
              </div>

              {/* Quizzes */}
              <div className="ml-4 mt-2">
                <h4 className="font-medium">Quizzes:</h4>
                {module.quiz?.length ? (
                  module.quiz.map((quiz) => (
                    <div key={quiz.id} className="ml-4">
                      <p className="font-medium">- {quiz.title}</p>
                      {quiz.questions?.map((q) => (
                        <div key={q.id} className="ml-4">
                          <p>Q: {q.text}</p>
                          {q.choices?.map((c) => (
                            <p key={c.id} className="ml-6">
                              • {c.text} {c.is_correct ? "(correct)" : ""}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="ml-4 italic">No quizzes</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No modules added.</p>
        )}
      </Card>

      <div className="flex gap-3">
        <button
          onClick={() => handleReviewAction("approved")}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          disabled={course.status === "approved"}
        >
          ✓ Approve Course
        </button>
        <button
          onClick={() => handleReviewAction("rejected")}
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          disabled={course.status === "rejected"}
        >
          ✗ Reject Course
        </button>
      </div>
    </div>
  );
};

export default CourseReviewPage;