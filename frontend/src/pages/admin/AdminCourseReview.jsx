import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";

const CourseReviewPage = ({ courseId, onBack }) => {
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessonsMap, setLessonsMap] = useState({});
  const [quizzesMap, setQuizzesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    const token = localStorage.getItem("accessToken");
    setLoading(true);
    
    try {
      
      const courseRes = await axiosInstance.get(`/admin/courses/${courseId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourse(courseRes.data);

      const modulesRes = await axiosInstance.get(`/modules/?course=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const moduleData = modulesRes.data.results || modulesRes.data || [];
      setModules(moduleData);

      
      const lessonMap = {};
      const quizMap = {};
      
      for (const module of moduleData) {
        
        try {
          const lessonsRes = await axiosInstance.get(`/lessons/?module=${module.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          lessonMap[module.id] = lessonsRes.data.results || lessonsRes.data || [];
        } catch (err) {
          console.error(`Error fetching lessons for module ${module.id}:`, err);
          lessonMap[module.id] = [];
        }

        
        try {
          const quizzesRes = await axiosInstance.get(`/quiz/quizzes/?module=${module.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const quizData = quizzesRes.data.results || quizzesRes.data || [];
          
          
          const quizzesWithQuestions = await Promise.all(
            quizData.map(async (quiz) => {
              try {
                const questionsRes = await axiosInstance.get(`/quiz/questions/?quiz=${quiz.id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const questions = questionsRes.data.results || questionsRes.data || [];
                
                
                const questionsWithChoices = await Promise.all(
                  questions.map(async (question) => {
                    try {
                      const choicesRes = await axiosInstance.get(`/quiz/choices/?question=${question.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      const choices = choicesRes.data.results || choicesRes.data || [];
                      return { ...question, choices };
                    } catch (err) {
                      console.error(`Error fetching choices for question ${question.id}:`, err);
                      return { ...question, choices: [] };
                    }
                  })
                );
                
                return { ...quiz, questions: questionsWithChoices };
              } catch (err) {
                console.error(`Error fetching questions for quiz ${quiz.id}:`, err);
                return { ...quiz, questions: [] };
              }
            })
          );
          
          quizMap[module.id] = quizzesWithQuestions;
        } catch (err) {
          console.error(`Error fetching quizzes for module ${module.id}:`, err);
          quizMap[module.id] = [];
        }
      }
      
      setLessonsMap(lessonMap);
      setQuizzesMap(quizMap);
      
    } catch (err) {
      console.error("Error fetching course details:", err);
      toast.error("Failed to fetch course details");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    const token = localStorage.getItem("accessToken");
    try {
      await axiosInstance.patch(
        `/admin/courses/${courseId}/`,
        { status: newStatus, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Course ${newStatus} successfully!`);
      setCourse(prev => ({ ...prev, status: newStatus }));
      
      if (onBack) {
        setTimeout(() => onBack(), 1500);
      }
    } catch (err) {
      console.error("Error updating course:", err);
      toast.error(`Failed to ${newStatus} course`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading course details...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 bg-white shadow rounded">
        <p className="text-red-600">Course not found</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            ← Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow rounded">
      <button
        onClick={onBack}
        className="mb-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back
      </button>

      {/* Course Details */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
        <p className="text-gray-600 mb-4">{course.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Instructor:</span> {course.instructor_username || course.instructor_name || 'N/A'}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Category:</span> {course.category_name || course.category || 'N/A'}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Price:</span> {course.is_free ? 'Free' : `₹${course.price}`}
            </p>
          </div>
          <div>
            <p className="text-sm mb-2">
              <span className="font-semibold">Current Status:</span>{" "}
              <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                course.status === "approved"
                  ? "bg-green-100 text-green-700"
                  : course.status === "rejected"
                  ? "bg-red-100 text-red-700"
                  : course.status === "submitted"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {course.status}
              </span>
            </p>
          </div>
        </div>

        {course.course_image && (
          <img
            src={course.course_image}
            alt="Course"
            className="w-full max-w-md h-48 object-cover rounded mb-4"
          />
        )}
      </div>

      {/* Modules, Lessons, Quizzes */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Course Curriculum</h3>
        {modules && modules.length > 0 ? (
          <div className="space-y-4">
            {modules.map((module, index) => (
              <div key={module.id} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-lg font-semibold text-purple-600 mb-2">
                  Module {index + 1}: {module.title}
                </h4>
                <p className="text-gray-600 mb-3">{module.description}</p>

                {/* Lessons */}
                <div className="mb-4">
                  <h5 className="text-md font-medium mb-2">📚 Lessons:</h5>
                  {lessonsMap[module.id] && lessonsMap[module.id].length > 0 ? (
                    <ul className="list-disc ml-6 space-y-2">
                      {lessonsMap[module.id].map((lesson) => (
                        <li key={lesson.id} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-semibold">{lesson.title}</span>
                              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {lesson.content_type === "video" ? "🎥 Video" : "📄 Text"}
                              </span>
                              {lesson.is_preview && (
                                <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  Preview
                                </span>
                              )}
                              <p className="text-sm text-gray-600 mt-1">{lesson.content}</p>
                              
                              {lesson.resources && lesson.resources.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium">Resources:</p>
                                  <ul className="text-sm text-blue-600">
                                    {lesson.resources.map((resource) => (
                                      <li key={resource.id}>
                                        • {resource.title}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 ml-6">No lessons added yet.</p>
                  )}
                </div>

                {/* Quizzes */}
                <div>
                  <h5 className="text-md font-medium mb-2">📝 Quizzes:</h5>
                  {quizzesMap[module.id] && quizzesMap[module.id].length > 0 ? (
                    <div className="space-y-3">
                      {quizzesMap[module.id].map((quiz) => (
                        <div key={quiz.id} className="bg-white border rounded p-3">
                          <p className="font-semibold text-green-600">{quiz.title}</p>
                          <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                          
                          {quiz.questions && quiz.questions.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Questions ({quiz.questions.length}):</p>
                              <ul className="space-y-2">
                                {quiz.questions.map((question, qIndex) => (
                                  <li key={question.id} className="bg-gray-50 p-2 rounded">
                                    <p className="font-medium text-sm">
                                      {qIndex + 1}. {question.text}
                                    </p>
                                    {question.choices && question.choices.length > 0 && (
                                      <ul className="mt-1 ml-4 text-sm">
                                        {question.choices.map((choice) => (
                                          <li key={choice.id} className={`${choice.is_correct ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                            • {choice.text}
                                            {choice.is_correct && <span className="ml-1">✓</span>}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 ml-6">No quizzes added yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No modules added yet.</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Admin Remarks (optional)</label>
        <textarea
          className="w-full border rounded p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add your remarks here..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => updateStatus("approved")}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          disabled={course.status === "approved"}
        >
          ✓ Approve Course
        </button>
        <button
          onClick={() => updateStatus("rejected")}
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