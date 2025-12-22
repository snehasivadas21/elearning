import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

import ModuleModal from "../../components/tutor/ModuleModal";
import LessonModal from "../../components/tutor/LessonModal";

const LessonPreview = ({ lesson }) => {
  if (lesson.content_type === "video" && lesson.content_url) {
    return (
      <video
        src={lesson.content_url}
        controls
        className="w-full max-w-md mt-2 rounded border"
      />
    );
  }

  if (lesson.content_type === "text" && lesson.content_url) {
    return (
      <p className="mt-2 text-sm text-gray-700 line-clamp-3">
        {lesson.content_url}
      </p>
    );
  }

  return null;
};

const InstructorCourseContent = () => {
  const { id: courseId } = useParams(); 
  const [modules, setModules] = useState([]);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

   const fetchModules = async () => {
    try {
      const res = await axiosInstance.get(`/modules/?course=${courseId}`);
      setModules(res.data);
    } catch (err) {
      console.error("Failed to load modules", err);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  const handleAddModule = () => {
    setSelectedModule(null);
    setShowModuleModal(true);
  };

  const handleEditModule = (module) => {
    setSelectedModule(module);
    setShowModuleModal(true);
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm("Delete this module?")) return;
    await axiosInstance.delete(`/modules/${moduleId}/`);
    fetchModules();
  };

  const handleAddLesson = (module) => {
    setSelectedLesson(module);
    selectedLesson(null)
    setShowLessonModal(true);
  };

  const handleEditLesson = (module, lesson) => {
    setSelectedLesson(module);
    setSelectedLesson(lesson)
    setShowLessonModal(true);
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Delete this lesson?")) return;
    await axiosInstance.delete(`/lessons/${lessonId}/`);
    fetchModules();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Course Content</h2>
        <button
          onClick={handleAddModule}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          + Add Module
        </button>
      </div>

      {modules.length === 0 && (
        <p className="text-gray-500">No modules added yet.</p>
      )}

      <div className="space-y-6">
        {modules.map((mod) => (
          <div key={mod.id} className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">{mod.title}</h3>
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

            <p className="text-sm text-gray-600 mb-3">{mod.description}</p>

            <button
              onClick={() => handleAddLesson(mod)}
              className="mb-4 bg-gray-200 px-3 py-1 rounded text-sm"
            >
              + Add Lesson
            </button>

            {mod.lessons?.length === 0 && (
              <p className="text-sm text-gray-400">No lessons yet.</p>
            )}

            <ul>
              {mod.lessons?.map((lesson) => (
                <li
                  key={lesson.id}
                  className={`border rounded p-3 mb-3 ${
                    lesson.is_preview
                      ? "bg-yellow-50 border-yellow-300"
                      : "bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-full">
                      <h5 className="font-medium">
                        {lesson.title}{" "}
                        <span className="text-xs text-gray-500">
                          ({lesson.content_type})
                        </span>
                        {lesson.is_preview && (
                          <span className="ml-2 text-xs font-semibold text-yellow-700">
                            PREVIEW
                          </span>
                        )}
                      </h5>

                      <LessonPreview lesson={lesson} />

                      {lesson.resources?.length > 0 && (
                        <ul className="mt-2 text-sm text-gray-600">
                          {lesson.resources.map((res) => (
                            <li key={res.id}>
                              📄 {res.title} –{" "}
                              <a
                                href={res.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                              >
                                Download
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="ml-4 space-y-1 text-sm">
                      <button
                        onClick={() => handleEditLesson(mod, lesson)}
                        className="block text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="block text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {showModuleModal && (
        <ModuleModal
          show={showModuleModal}
          onClose={() => setShowModuleModal(false)}
          moduleData={selectedModule}
          onSubmit={async (data, id) => {
            if (id) {
              await axiosInstance.put(`/modules/${id}/`, data);
            } else {
              data.set("course", courseId);
              await axiosInstance.post("/modules/", data);
            }
            setShowModuleModal(false);
            fetchModules();
          }}
        />
      )}

      {showLessonModal && (
        <LessonModal
          show={showLessonModal}
          onClose={() => {
            setShowLessonModal(false);
            fetchModules();
          }}
          lessonData={selectedLesson}
          moduleId={selectedModule?.id}
        />
      )}
    </div>
  );
};

export default InstructorCourseContent;