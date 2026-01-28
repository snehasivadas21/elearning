import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import CourseProgressBar from "../../components/student/CourseProgressBar";
import CourseChat from "../../components/user/CourseChat";
import { format } from "date-fns";

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
    lesson.video_source === "upload" &&
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

const fetchCourse = async (id) => {
  const res = await axiosInstance.get(`/users/my-courses/${id}/`);
  return res.data;
};

const CourseChatModal = ({ courseId, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="absolute right-0 top-0 h-full w-full sm:w-[600px] lg:w-[800px] bg-white shadow-xl flex flex-col">

        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">AI Tutor</h2>
          <button
            onClick={onClose}
            className="text-xl text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <CourseChat courseId={courseId} />
        </div>
      </div>
    </div>
  );
};

const StudentCourseDetail = () => {
  const { id } = useParams();
  const [showChat, setShowChat] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: course, isLoading } = useQuery({
    queryKey: ["student-course", id],
    queryFn: () => fetchCourse(id),
    enabled: !!id,
  });

  const toggleLesson = useMutation({
    mutationFn: (lessonId) =>
      axiosInstance.post(`/lesson-progress/lessons/${lessonId}/toggle/`),

    onSuccess: () => {
      queryClient.invalidateQueries(["student-course", id]);
    },
  });

  if (isLoading) return <p className="p-6">Loading course...</p>;
  if (!course) return <p>Course not found</p>;

  return (
    <div className="relative max-w-7xl mx-auto p-6 space-y-6">
      <div className="md:col-span-2">
        <div className="relative mb-4">
            <img
              src={course.course_image}
              alt={course.title}
              className="rounded-xl w-full h-64 object-cover"
            />
            {course.category_name && (
              <span className="absolute top-4 left-4 bg-white text-sm px-3 py-1 rounded-full shadow">
                {course.category_name}
              </span>
            )}
        </div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-gray-600 mt-2">{course.description}</p>
        <div className="flex gap-4 text-sm text-gray-500">
          <span className="bg-gray-300 text-sm px-3 py-1 rounded-full">{course.level}</span>
          <span className="bg-gray-300 text-sm px-3 py-1 rounded-full">📜 Certificate</span>
          <span className="bg-gray-300 text-sm px-3 py-1 rounded-full">🔒 Lifetime Access</span>
          <span className="bg-gray-300 text-sm px-3 py-1 rounded-full">📄 Downloadable resources</span>

            {course.updated_at && (
              <p className="bg-gray-300 text-sm px-3 py-1 rounded-full">
              Updated on {format(new Date(course.updated_at), "dd/MM/yyyy")}
              </p>
            )}
        </div>
        
        <div className="text-2xl font-bold">
            ₹{course.price}
        </div>

        <div className="mt-4 flex items-center gap-4 text-lg text-gray-500">
          <span>⭐ {course.rating || "4.5"} (12,000 students)</span>
          <span>🌍 English</span>
        </div>
      </div> 

      <CourseProgressBar percentage={course.progress_percentage ?? 0} />

      {course.modules.map((mod, i) => (
        <div key={mod.id} className="mt-6">
          <h2 className="font-semibold text-lg">
            {i + 1}. {mod.title}
          </h2>

          <ul className="mt-3 space-y-2">
            {mod.lessons?.map((lesson,i) => (
              <div
                key={lesson.id}
                className="border rounded-lg p-4 space-y-3 bg-white"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{i+1}. {lesson.title}</h4>

                  <input
                    type="checkbox"
                    checked={lesson.completed}
                    onChange={() => toggleLesson.mutate(lesson.id)}
                  />
                </div>

                <LessonPreview lesson={lesson} />

                {lesson.content_type === "text" && lesson.text_content && (
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {lesson.text_content}
                  </p>
                )}

                {lesson.resources?.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-semibold mb-1">Resources</p>
                    <ul className="text-sm space-y-1">
                      {lesson.resources.map((res) => (
                        <li key={res.id}>
                          📄{" "}
                          <a
                            href={res.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            {res.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </ul>
        </div>
      ))}

      <button
        onClick={() => navigate(`/student/chat/course/`)}
        className="fixed bottom-40 right-20 bg-green-600 hover:bg-green-700 text-white p-6 text-2xl rounded-full shadow-lg z-40"
        title="Open course community"
        
      >
      <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full px-2">
        3
      </span>
        💬
      </button>

      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-20 right-20 bg-purple-600 hover:bg-purple-700 text-white p-6 text-2xl animate-bounce rounded-full shadow-lg z-40"
        title="Ask AI Tutor"
      >
        🤖
      </button>

      {showChat && (
        <CourseChatModal
          courseId={course.id}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default StudentCourseDetail;

import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import CourseProgressBar from "../../components/student/CourseProgressBar";
import CourseChat from "../../components/user/CourseChat";
import { format } from "date-fns";

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
    lesson.video_source === "upload" &&
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

const fetchCourse = async (id) => {
  const res = await axiosInstance.get(`/users/my-courses/${id}/`);
  return res.data;
};

const CourseChatModal = ({ courseId, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="absolute right-0 top-0 h-full w-full sm:w-[600px] lg:w-[800px] bg-white shadow-xl flex flex-col">

        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">AI Tutor</h2>
          <button
            onClick={onClose}
            className="text-xl text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <CourseChat courseId={courseId} />
        </div>
      </div>
    </div>
  );
};

const StudentCourseDetail = () => {
  const { id } = useParams();
  const [showChat, setShowChat] = useState(false);
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["student-course", id],
    queryFn: () => fetchCourse(id),
    enabled: !!id,
  });

  const toggleLesson = useMutation({
    mutationFn: (lessonId) =>
      axiosInstance.post(`/lesson-progress/lessons/${lessonId}/toggle/`),

    onSuccess: () => {
      queryClient.invalidateQueries(["student-course", id]);
    },
  });

  if (isLoading) return <p className="p-6">Loading course...</p>;
  if (!course) return <p>Course not found</p>;

  return (
    <div className="relative max-w-7xl mx-auto p-6 space-y-6">
      <div className="md:col-span-2">
        <div className="relative mb-4">
            <img
              src={course.course_image}
              alt={course.title}
              className="rounded-xl w-full h-64 object-cover"
            />
            {course.category_name && (
              <span className="absolute top-4 left-4 bg-white text-sm px-3 py-1 rounded-full shadow">
                {course.category_name}
              </span>
            )}
        </div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-gray-600 mt-2">{course.description}</p>
        <div className="flex gap-4 text-sm text-gray-500">
          <span className="bg-gray-300 text-sm px-3 py-1 rounded-full">{course.level}</span>
          <span className="bg-gray-300 text-sm px-3 py-1 rounded-full">📜 Certificate</span>
          <span className="bg-gray-300 text-sm px-3 py-1 rounded-full">🔒 Lifetime Access</span>
          <span className="bg-gray-300 text-sm px-3 py-1 rounded-full">📄 Downloadable resources</span>

            {course.updated_at && (
              <p className="bg-gray-300 text-sm px-3 py-1 rounded-full">
              Updated on {format(new Date(course.updated_at), "dd/MM/yyyy")}
              </p>
            )}
        </div>
        
        <div className="text-2xl font-bold">
            ₹{course.price}
        </div>

        <div className="mt-4 flex items-center gap-4 text-lg text-gray-500">
          <span>⭐ {course.rating || "4.5"} (12,000 students)</span>
          <span>🌍 English</span>
        </div>
      </div> 

      <CourseProgressBar percentage={course.progress_percentage ?? 0} />

      {course.modules.map((mod, i) => (
        <div key={mod.id} className="mt-6">
          <h2 className="font-semibold text-lg">
            {i + 1}. {mod.title}
          </h2>

          <ul className="mt-3 space-y-2">
            {mod.lessons?.map((lesson,i) => (
              <div
                key={lesson.id}
                className="border rounded-lg p-4 space-y-3 bg-white"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{i+1}. {lesson.title}</h4>

                  <input
                    type="checkbox"
                    checked={lesson.completed}
                    onChange={() => toggleLesson.mutate(lesson.id)}
                  />
                </div>

                <LessonPreview lesson={lesson} />

                {lesson.content_type === "text" && lesson.text_content && (
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {lesson.text_content}
                  </p>
                )}

                {lesson.resources?.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-semibold mb-1">Resources</p>
                    <ul className="text-sm space-y-1">
                      {lesson.resources.map((res) => (
                        <li key={res.id}>
                          📄{" "}
                          <a
                            href={res.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            {res.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </ul>
        </div>
      ))}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-20 right-20 bg-purple-600 hover:bg-purple-700 text-white p-6 text-2xl animate-bounce rounded-full shadow-lg z-40"
        title="Ask AI Tutor"
      >
        🤖
      </button>

      {showChat && (
        <CourseChatModal
          courseId={course.id}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default StudentCourseDetail;
