import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { extractResults } from "../../api/api";
import ModuleModal from "../../components/tutor/ModuleModal";
import LessonModal from "../../components/tutor/LessonModal";
import { toast } from "react-toastify";

const getEmbedUrl = (url) => {
  if (!url) return "";

  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }

  if (url.includes("youtu.be/")) {
    return url.replace("youtu.be/", "www.youtube.com/embed/");
  }

  return url;
};


const LessonPreview = ({ lesson }) => {
  if (
    lesson.content_type === "video" &&
    lesson.video_source === "youtube" &&
    lesson.video_url
  ) {
    return (
      <div className="mt-3 aspect-video w-full max-w-xl">
        <iframe
          src={getEmbedUrl(lesson.video_url)}
          className="w-full h-full rounded border"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={lesson.title}
        />
      </div>
    );
  }

  if (
    lesson.content_type === "video" &&
    lesson.video_source === "cloud" &&
    lesson.video_url
  ) {
    return (
      <video
        src={lesson.video_url}
        controls
        preload="metadata"
        className="mt-3 w-full max-w-xl rounded border"
      />
    );
  }

  if (lesson.content_type === "text" && lesson.text_content) {
    return (
      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
        {lesson.text_content}
      </p>
    );
  }

  return null;
};

const InstructorCourseContent = () => {
  const { id: courseId } = useParams();

  const [course, setCourse] = useState(null)

  const [modules, setModules] = useState([]);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  
  const isSubmitted = course?.status === "submitted";
  const isApproved = course?.status === "approved";

  const canAddContent = course?.status === "draft" || isApproved;
  const canEditContent = course?.status === "draft";

  const fetchCourse = async () => {
    try {
      const res = await axiosInstance.get(`/instructor/courses/${courseId}/`);
      setCourse(res.data);
    } catch (err) {
      console.error("Failed to load course", err);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await axiosInstance.get(`/modules/?course=${courseId}`);
      setModules(extractResults(res));
    } catch (err) {
      console.error("Failed to load modules", err);
    }
  };

  useEffect(() => {
    fetchCourse();
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
    setSelectedModule(module);
    setSelectedLesson(null);
    setShowLessonModal(true);
  };

  const handleEditLesson = (module, lesson) => {
    setSelectedModule(module);
    setSelectedLesson(lesson);
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
        <h2 className="text-2xl font-bold text-purple-600">Course Content</h2>
        
        {isSubmitted && (
          <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            🔒 Course is under review. Editing is disabled.
          </div>
        )}

        {isApproved && (
          <div className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            ✅ Course is live. You can add new content, but existing content is locked.
          </div>
        )}

        <button
          onClick={handleAddModule}
          disabled={!canAddContent}
          className={`px-4 py-2 rounded text-white ${
            canAddContent ? "bg-purple-600" : "bg-gray-400 cursor-not-allowed"
          }`}
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
              {canEditContent && (
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
              )}

            </div>

            <p className="text-sm text-gray-600 mb-3">
              {mod.description}
            </p>

            <button
              onClick={() => handleAddLesson(mod)}
              disabled={!canAddContent}
              className={`mb-4 px-3 py-1 rounded text-sm ${
                canAddContent ? "bg-gray-200" : "bg-gray-300 cursor-not-allowed"
              }`}
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
                          (
                          {lesson.content_type === "video"
                            ? lesson.video_source === "youtube"
                              ? "YouTube Video"
                              : "Uploaded Video"
                            : "Text"}
                          )
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

                    {canEditContent && (
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
                    )}

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
              await axiosInstance.patch(`/modules/${id}/`, data);
              toast.success("Module updated successfully 🎉");
            } else {
              data.set("course", courseId);
              await axiosInstance.post("/modules/", data);
              toast.success("Module created successfully 🎉");
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
