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

  const { data: course, isLoading } = useQuery({
    queryKey: ["student-course", id],
    queryFn: () => fetchCourse(id),
    enabled: !!id,
  });

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
    <div className="relative max-w-7xl mx-auto p-6 space-y-6">

      {/* COURSE HEADER */}
      <div>
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
        <p className="text-gray-600">{course.description}</p>

        <div className="flex gap-3 mt-3 flex-wrap text-sm text-gray-600">
          <span className="bg-gray-200 px-3 py-1 rounded-full">
            {course.level}
          </span>
          <span className="bg-gray-200 px-3 py-1 rounded-full">
            📜 Certificate
          </span>
          <span className="bg-gray-200 px-3 py-1 rounded-full">📄 Downloadable resources</span>
          {course.total_duration && (
            <span className="bg-gray-200 px-3 py-1 rounded-full">
              ⏱ {formatDuration(course.total_duration)}
            </span>
          )}
          {course.updated_at && (
            <span className="bg-gray-200 px-3 py-1 rounded-full">
              Updated {format(new Date(course.updated_at), "dd/MM/yyyy")}
            </span>
          )}
        </div>

        <div className="text-2xl font-bold mt-2">
          ₹{course.price}
        </div>

        <div className="mt-4 flex items-center gap-4 text-lg text-gray-500">
          <span>⭐ {course.avg_rating ? course.avg_rating.toFixed(1) : "No ratings"} -
            ({course.review_count} reviews)
          </span>
          <span>🌍 English</span>
        </div>
      </div>

      <CourseProgressBar percentage={course.progress_percentage ?? 0} />

      {/* MODULES */}
      {course.modules.map((mod, index) => (
        <div key={mod.id} className="mt-6">
          <h2 className="font-semibold text-lg">
            {index + 1}. {mod.title}
          </h2>

          <div className="space-y-4 mt-3">
            {mod.lessons.map((lesson, i) => (
              <div key={lesson.id} className="border p-4 rounded bg-white">

                <div className="flex justify-between">
                  <h4 className="font-medium">
                    {i + 1}. {lesson.title}
                  </h4>

                  {lesson.completed && (
                    <div className="mt-2 text-green-600 text-sm font-semibold">
                      ✔ Completed
                    </div>
                  )}

                  {lesson.duration > 0 && (
                    <span className="text-sm text-gray-500">
                      {formatDuration(lesson.duration)}
                    </span>
                  )}
                </div>

                {/* Uploaded Video Tracking */}
                {lesson.content_type === "video" &&
                  lesson.video_source === "cloud" &&
                  lesson.video_url && (
                    <video
                      src={lesson.video_url}
                      controls
                      className="mt-3 w-full rounded"
                      onTimeUpdate={(e) => {
                        const currentTime = Math.floor(
                          e.target.currentTime
                        );

                        if (
                          !lastSentRef.current[lesson.id] ||
                          currentTime -
                            lastSentRef.current[lesson.id] >=
                            5
                        ) {
                          lastSentRef.current[lesson.id] =
                            currentTime;

                          sendWatchProgress(
                            lesson.id,
                            currentTime
                          );
                        }
                      }}
                      onEnded={(e) => {
                        const fullDuration = Math.floor(e.target.duration);
                        sendWatchProgress(lesson.id, fullDuration);
                      }}
                    />
                  )}

                {/* YouTube Loading State */}
                {lesson.content_type === "video" &&
                  lesson.video_source === "youtube" &&
                  lesson.video_url && !youtubeReady && (
                    <div className="mt-3 w-full aspect-video bg-gray-200 rounded flex items-center justify-center">
                      <p className="text-gray-600">Loading YouTube player...</p>
                    </div>
                  )}

                {/* YouTube Tracking */}
                {lesson.content_type === "video" &&
                  lesson.video_source === "youtube" &&
                  lesson.video_url && youtubeReady && (
                    <YouTubePlayer
                      lesson={lesson}
                      sendWatchProgress={sendWatchProgress}
                      lastSentRef={lastSentRef}
                    />
                  )}

                {/* Text */}
                {lesson.content_type === "text" &&
                  lesson.text_content && (
                    <p className="mt-3 text-gray-700 whitespace-pre-line">
                      {lesson.text_content}
                    </p>
                  )}

                {/* Resources */}
                {lesson.resources?.length > 0 && (
                  <div className="pt-3 border-t mt-3">
                    <p className="text-sm font-semibold mb-1">
                      Resources
                    </p>
                    {lesson.resources.map((res) => (
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
            ))}
          </div>
        </div>
      ))}

      {/* COMMUNITY BUTTON */}
      <button
        onClick={() => navigate(`/student/chat/course/`)}
        className="fixed bottom-40 right-20 bg-green-600 hover:bg-green-700 text-white p-6 text-2xl rounded-full shadow-lg z-40"
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