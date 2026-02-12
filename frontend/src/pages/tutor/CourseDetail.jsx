import { useState } from "react";
import { format } from "date-fns";
import CourseReviews from "../../components/user/CourseReviews";

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dgqjlqivb/image/upload/v1770222854/profile-avatar.jpg";

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

const CourseDetail = ({ course }) => {
  const [activeTab, setActiveTab] = useState("curriculum");
  const modules = course?.modules || [];
  const instructor = course?.instructor_profile || null;

  if (!course) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

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

        <div className="p-4 space-y-3">
          <h1 className="text-2xl font-bold">
            {course.title}
          </h1>

          <p className="text-gray-600 leading-relaxed">
            {course.description}
          </p>
        </div>

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
          <span>⭐ {course.avg_rating ? course.avg_rating.toFixed(1) : "No ratings"} -
            ({course.review_count} reviews)
          </span>
          <span>🌍 English</span>
        </div>

        {/* TABS */}
        <div className="mt-6 border-b flex gap-6">
          {["curriculum", "instructor", "reviews"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 capitalize font-medium ${
                activeTab === tab
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6 bg-white rounded-xl border shadow p-6">

          {activeTab === "curriculum" && (
            <>
              <h2 className="text-lg font-bold mb-4">Course Curriculum</h2>

              {!modules || modules.length === 0 ? (
                <p className="text-gray-500">No modules available yet.</p>
              ) : (
                modules.map((mod, idx) => (
                  <div key={mod.id} className="mb-4">
                    <h3 className="font-semibold text-purple-700 mb-2">
                      {idx + 1}. {mod.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{mod.description}</p>
                    <ul className="space-y-3 pl-4 border-l-2 border-purple-200">
                      {mod.lessons?.map((lesson, i) => (
                        <li key={lesson.id} className="text-gray-700">
                          <div className="flex justify-between items-center">
                            <span>
                              {i + 1}. {lesson.title}
                            </span>
                          </div>

                          <LessonPreview lesson={lesson} />

                          {lesson.is_preview && lesson.content_type === "text" && (
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                              {lesson.content_url}
                            </p>
                          )}

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
                                    {res.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "instructor" && (
            <>
              <h2 className="text-lg font-bold mb-4">Instructor</h2>
              <div className="flex items-center gap-4">
                <img
                  src={instructor?.profile_image || DEFAULT_AVATAR}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="p-4 space-y-2">
                  <h1 className="text-xl font-bold">{instructor?.full_name}</h1>
                  <p className="text-gray-600 leading-relaxed">{instructor?.headline}</p>
                  <p className="text-gray-600 text-sm">
                    {instructor?.bio || "No bio available."}
                  </p>
                  <p className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border">{instructor?.skills}</p>
                </div>
              </div>
            </>
          )}

          {activeTab === "reviews" && (
            <CourseReviews
              courseId={course.id}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
