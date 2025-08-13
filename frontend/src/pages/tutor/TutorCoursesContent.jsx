import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

import ModuleModal from "../../components/tutor/ModuleModal";
import LessonModal from "../../components/tutor/LessonModal";
import QuizModal from "../../components/tutor/QuizModal";


const InstructorCourseContent = () => {
  const { id } = useParams(); 
  const [modules, setModules] = useState([]);
  const [lessonsMap, setLessonsMap] = useState({}); 
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [modalMode, setModalMode] = useState("Add");

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [currentModuleId, setCurrentModuleId] = useState(null);

  const [showQuizModal,setShowQuizModal] = useState(false)
  const [currentQuizModuleId,setCurrentQuizModuleId]=useState(null)

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!id || id === "undefined") return ;
    fetchModules();
  }, [id]);

  const fetchModules = async () => {
    try {
      const res = await axiosInstance.get(`/courses/modules/?course=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModules(res.data);

      const lessonMap = {};
      for (let mod of res.data) {
        const lres = await axiosInstance.get(`/courses/lessons/?module=${mod.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        lessonMap[mod.id] = lres.data;
      }
      setLessonsMap(lessonMap);
    } catch (error) {
      console.error("Error fetching modules or lessons:",error)
    }
  };  

  const handleAddModule = () => {
    setSelectedModule(null);
    setModalMode("Add");
    setShowModuleModal(true);
  };

  const handleEditModule = (module) => {
    setSelectedModule(module);
    setModalMode("Edit");
    setShowModuleModal(true);
  };

  const handleSubmitModule = async (data, mid = null) => {
    try {
      const url = mid
        ? `/courses/modules/${mid}/`
        : "/courses/modules/";
      const method = mid ? axiosInstance.put : axiosInstance.post;
      const payload = { ...data };
      if (!mid) payload.course = id;
      await method(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModuleModal(false);
      fetchModules();
    } catch (err) {
      console.error("Error saving module:", err);
    }
  };

  const handleDeleteModule = async (mid) => {
    if (!window.confirm("Are you sure to delete this module?")) return;
    try {
      await axiosInstance.delete(`/courses/modules/${mid}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchModules();
    } catch (err) {
      console.error("Error deleting module:", err);
    }
  };

  const handleAddLesson = (moduleId) => {
    setSelectedLesson(null);
    setCurrentModuleId(moduleId);
    setModalMode("Add");
    setShowLessonModal(true);
  };

  const handleEditLesson = (moduleId, lesson) => {
    setSelectedLesson(lesson);
    setCurrentModuleId(moduleId);
    setModalMode("Edit");
    setShowLessonModal(true);
  };

  const handleSubmitLesson = async (data, lid = null) => {
    try {
      const url = lid
        ? `/courses/lessons/${lid}/`
        : "/courses/lessons/";
      const method = lid ? axiosInstance.put : axiosInstance.post;

      const payload = { ...data };
      if (!lid) payload.module = currentModuleId;

      await method(url, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowLessonModal(false);
      fetchModules();
    } catch (err) {
      console.error("Error saving lesson:", err);
    }
  };

  const handleDeleteLesson = async (lid) => {
    if (!window.confirm("Are you sure to delete this lesson?")) return;
    try {
      await axiosInstance.delete(`/courses/lessons/${lid}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchModules();
    } catch (err) {
      console.error("Error deleting lesson:", err);
    }
  };

  const handleAddQuiz = (moduleId) => {
    setCurrentQuizModuleId(moduleId);
    setShowQuizModal(true);
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-purple-700 mb-4">Manage Course Content</h2>
      <button
        onClick={handleAddModule}
        className="mb-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        + Add Module
      </button>

      {modules.map((mod) => (
        <div key={mod.id} className="mb-6 border p-4 rounded shadow">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="text-xl font-semibold text-purple-600">{mod.title}</h3>
              <p>{mod.description}</p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleEditModule(mod)}
                className="text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteModule(mod.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="ml-4">
            <h4 className="font-semibold mb-1">Lessons:</h4>
            <ul className="list-disc ml-6">
              {lessonsMap[mod.id]?.map((lesson) => (
                <li key={lesson.id} className="flex justify-between items-center">
                  <span>
                      {lesson.title} ({lesson.content_type}) {lesson.is_preview && <em className="text-yellow-600">[Preview]</em>}
                  </span>
                  {lesson.resources?.length > 0 && (
                    <ul className="ml-6 mt-1 text-sm text-gray-600">
                      {lesson.resources.map((res)=>(
                        <li key={res.id}>
                          {res.title} - {" "}
                          <a href={res.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                            Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEditLesson(mod.id, lesson)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleAddLesson(mod.id)}
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Add Lesson
            </button>
            <button
              onClick={()=>handleAddQuiz(mod.id)}
              className="mt-2 ml-3 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700" 
            >
              + Add Quiz
            </button>
          </div>
        </div>
      ))}

      <ModuleModal
        show={showModuleModal}
        onClose={() => setShowModuleModal(false)}
        onSubmit={handleSubmitModule}
        moduleData={selectedModule}
        mode={modalMode}
      />

      <LessonModal
        show={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        onSubmit={handleSubmitLesson}
        lessonData={selectedLesson}
        moduleId={currentModuleId}
        mode={modalMode}
      />

      <QuizModal
       show = {showQuizModal}
       onClose = {()=>setShowQuizModal(false)}
       moduleId = {currentQuizModuleId}
       onSaved = {fetchModules}
       />

    </div>
  );
};

export default InstructorCourseContent;