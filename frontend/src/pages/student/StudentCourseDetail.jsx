import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../api/axiosInstance";
import CourseProgressBar from "../../components/student/CourseProgressBar";
import CourseChat from "../../components/user/CourseChat";
import { format } from "date-fns";

const formatDuration = (seconds) => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const getYoutubeVideoId = (url) => {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
  const match = url?.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const fetchCourse = async (id) => {
  const res = await axiosInstance.get(`/users/my-courses/${id}/`);
  return res.data;
};

const StudentCourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showChat, setShowChat] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const lastSentRef = useRef({});
  const [selectedLesson, setSelectedLesson] = useState(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ["student-course", id],
    queryFn: () => fetchCourse(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (course && !selectedLesson) {
      const firstLesson =
        course.modules?.[0]?.lessons?.[0] || null;
      setSelectedLesson(firstLesson);
    }
  }, [course]);

  const sendWatchProgress = async (lessonId, watchedSeconds) => {
    try {
      await axiosInstance.post(
        `/lesson-progress/lessons/${lessonId}/watch/`,
        { watched_seconds: watchedSeconds }
      );

      // Refresh progress
      queryClient.invalidateQueries(["student-course", id]);
    } catch (err) {
      console.log("Watch update failed");
    }
  };

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      
      // Set up callback for when API is ready
      window.onYouTubeIframeAPIReady = () => {
        setYoutubeReady(true);
      };
      
      document.body.appendChild(tag);
    } else {
      setYoutubeReady(true);
    }
  }, []);

  if (isLoading) return <p className="p-6">Loading course...</p>;
  if (!course) return <p>Course not found</p>;

  return (
     <div className="h-screen flex flex-col bg-gray-100">

      {/* COURSE HEADER */}
      <div className="bg-white shadow rounded-xl overflow-hidden mb-6">

        <div className="flex flex-col md:flex-row">

          {/* RIGHT: COURSE DETAILS */}
          <div className="md:w-2/3 p-6 flex flex-col justify-between">

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {course.title}
              </h1>

              <p className="text-gray-600 mt-2 line-clamp-3">
                {course.description}
              </p>

              {/* TAGS */}
              <div className="flex flex-wrap gap-2 mt-4 text-sm">
                <span className="bg-blue-50 px-3 py-1 rounded-full font-medium">
                  {course.level}
                </span>

                <span className="bg-purple-50 px-3 py-1 rounded-full">
                  📜 Certificate of completion
                </span>

                <span className="bg-green-50 px-3 py-1 rounded-full">
                  📄 Downloadable resources
                </span>

                {course.total_duration && (
                  <span className="bg-orange-50 px-3 py-1 rounded-full">
                    ⏱ {formatDuration(course.total_duration)}
                  </span>
                )}

                {course.updated_at && (
                  <span className="bg-gray-100 px-3 py-1 rounded-full">
                    Updated {format(new Date(course.updated_at), "dd/MM/yyyy")}
                  </span>
                )}
              </div>

              {/* RATING */}
              <div className="mt-4 flex items-center gap-3 text-gray-600">
                <span className="font-semibold">
                  ⭐ {course.avg_rating ? course.avg_rating.toFixed(1) : "No ratings"}
                </span>
                <span className="text-sm">
                  ({course.review_count} reviews)
                </span>
                <span className="text-sm">🌍 English</span>
              </div>
            </div>

            {/* PRICE + PROGRESS */}
            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div className="text-2xl font-bold text-gray-800">
                ₹{course.price}
              </div>

              <div className="md:w-1/2">
                <CourseProgressBar
                  percentage={course.progress_percentage ?? 0}
                />
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* MODULES */}
      <div className="flex flex-1 overflow-hidden">

        {/* ===== Sidebar ===== */}
        <div className="w-80 bg-white border-r overflow-y-auto p-4">
          {course.modules.map((mod, index) => (
            <div key={mod.id} className="mb-6">
              <h2 className="font-semibold text-sm mb-2 text-gray-700">
                {index + 1}. {mod.title}
              </h2>

              {mod.lessons.map((lesson, i) => (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition text-sm
                    ${
                      selectedLesson?.id === lesson.id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-100"
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span>
                      {i + 1}. {lesson.title}
                    </span>
                    {lesson.completed && (
                      <span className="text-green-600 text-xs">
                        ✔
                      </span>
                    )}
                  </div>

                  {lesson.duration > 0 && (
                    <p className="text-xs text-gray-500">
                      {formatDuration(lesson.duration)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8">

          {selectedLesson ? (
            <div className="bg-white rounded-xl shadow p-6">

              <h2 className="text-lg font-semibold mb-4">
                {selectedLesson.title}
              </h2>

                {/* Uploaded Video Tracking */}
                {selectedLesson.content_type === "video" &&
                  selectedLesson.video_source === "cloud" &&
                  selectedLesson.video_url && (
                    <video
                      src={selectedLesson.video_url}
                      controls
                      className="mb-4 w-full rounded-lg"
                      onTimeUpdate={(e) => {
                        const currentTime = Math.floor(
                          e.target.currentTime
                        );

                        if (
                          !lastSentRef.current[selectedLesson.id] ||
                          currentTime -
                            lastSentRef.current[selectedLesson.id] >=
                            5
                        ) {
                          lastSentRef.current[selectedLesson.id] =
                            currentTime;

                          sendWatchProgress(
                            selectedLesson.id,
                            currentTime
                          );
                        }
                      }}
                      onEnded={(e) => {
                        const fullDuration = Math.floor(e.target.duration);
                        sendWatchProgress(selectedLesson.id, fullDuration);
                      }}
                    />
                  )}

                {/* YouTube Loading State */}
                {selectedLesson.content_type === "video" &&
                  selectedLesson.video_source === "youtube" &&
                  selectedLesson.video_url && !youtubeReady && (
                    <div className="mt-3 w-full aspect-video bg-gray-200 rounded flex items-center justify-center">
                      <p className="text-gray-600">Loading YouTube player...</p>
                    </div>
                  )}

                {/* YouTube Tracking */}
                {selectedLesson.content_type === "video" &&
                  selectedLesson.video_source === "youtube" &&
                  selectedLesson.video_url && youtubeReady && (
                    <YouTubePlayer
                      lesson={selectedLesson}
                      sendWatchProgress={sendWatchProgress}
                      lastSentRef={lastSentRef}
                    />
                  )}

                {/* Text */}
                {selectedLesson.content_type === "text" &&
                  selectedLesson.text_content && (
                    <p className="mt-3 text-gray-700 whitespace-pre-line">
                      {selectedLesson.text_content}
                    </p>
                  )}

                {/* Resources */}
                {selectedLesson.resources?.length > 0 && (
                  <div className="pt-3 border-t mt-3">
                    <p className="text-sm font-semibold mb-1">
                      Resources
                    </p>
                    {selectedLesson.resources.map((res) => (
                      <a
                        key={res.id}
                        href={res.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 underline text-sm"
                      >
                        📄 {res.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-6 text-gray-500">
                Select a lesson to begin.
              </div>
            )}
          </div>
        </div>
      

      {/* COMMUNITY BUTTON */}
      <button
        onClick={() => navigate(`/student/chat/course/`)}
        className="fixed bottom-50 right-20 bg-green-600 hover:bg-green-700 text-white p-6 text-2xl rounded-full shadow-lg z-40"
      >
        💬
      </button>

      {/* AI BUTTON */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-20 right-20 bg-purple-600 hover:bg-purple-700 text-white p-6 text-2xl rounded-full shadow-lg z-40"
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

/* ===========================
   YOUTUBE PLAYER COMPONENT
=========================== */

const YouTubePlayer = ({ lesson, sendWatchProgress, lastSentRef }) => {
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const videoId =
  lesson.video_source === "youtube"
    ? getYoutubeVideoId(lesson.video_url)
    : null;


  useEffect(() => {
    if (!window.YT || !window.YT.Player || !videoId) return;

    // Create player
    playerRef.current = new window.YT.Player(
      `yt-player-${lesson.id}`,
      {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          'playsinline': 1,
          origin: window.location.origin
        },
        events: {
          onStateChange: (event) => {
            // Clear any existing interval
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }

            // If playing, start tracking
            if (event.data === window.YT.PlayerState.PLAYING) {
              intervalRef.current = setInterval(() => {
                try {
                  const currentTime = Math.floor(
                    playerRef.current.getCurrentTime()
                  );

                  if (
                    !lastSentRef.current[lesson.id] ||
                    currentTime - lastSentRef.current[lesson.id] >= 5
                  ) {
                    lastSentRef.current[lesson.id] = currentTime;
                    sendWatchProgress(lesson.id, currentTime);
                  }
                } catch (err) {
                  console.error("Error tracking progress:", err);
                }
              }, 5000);
            }
          },
        },
      }
    );

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, lesson.id, sendWatchProgress]);

  return (
    <div className="mt-3 w-full">
      <div
        id={`yt-player-${lesson.id}`}
        className="w-full aspect-video"
      />
    </div>
  );
};

const CourseChatModal = ({ courseId, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="absolute right-0 top-0 h-full w-full sm:w-[600px] bg-white shadow-xl flex flex-col">
        <div className="flex justify-between p-4 border-b">
          <h2 className="font-semibold">AI Tutor</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="flex-1 overflow-hidden">
          <CourseChat courseId={courseId} />
        </div>
      </div>
    </div>
  );
};

export default StudentCourseDetail;