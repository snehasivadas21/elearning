import { useEffect, useState } from "react";
import { completeLesson, getCourseProgress } from "../../api/progress";

export default function CourseProgress({ courseId,lessons }){
    const [progress,setProgress] = useState(0)
    const [completedLessons,setCompletedLesson] = useState([])

    useEffect(()=>{
        fetchProgress();
    },[]);

    const fetchProgress = async () => {
        try {
            const res = await getCourseProgress(courseId)
            setProgress(res.data.progress)
        } catch (error) {
            console.error("Error fetching progress",error);
        }
    }

    const handleCompleteLesson = async (lessonId) => {
        try {
            await completeLesson(lessonId)
            setCompletedLesson((prev)=>[...prev,lessonId])
            fetchProgress();
        } catch (error) {
            console.error("Error completing lesson",error)            
        }
    }

    const handleCompleteLesson = async (lessonId) => {
        try {
            await completeLesson(lessonId)
            setCompletedLesson((prev)=>[...prev,lessonId])
            fetchProgress();
        } catch (error) {
            console.error("Error completing lesson",err)
            
        }
    }

    return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      {/* Progress Header */}
      <h2 className="text-xl font-semibold mb-4">📊 Course Progress</h2>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-5 mb-3 overflow-hidden">
        <motion.div
          className="bg-green-500 h-5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7 }}
        />
      </div>
      <p className="text-sm text-gray-700">{progress}% completed</p>

      {/* Lessons List */}
      <div className="mt-6 space-y-3">
        {lessons.map((lesson) => {
          const isCompleted = completedLessons.includes(lesson.id);
          return (
            <motion.div
              key={lesson.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * lesson.id }}
            >
              <span className={`font-medium ${isCompleted ? "line-through text-gray-400" : ""}`}>
                {lesson.title}
              </span>
              {isCompleted ? (
                <motion.span
                  className="text-green-600 font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✅
                </motion.span>
              ) : (
                <button
                  onClick={() => handleCompleteLesson(lesson.id)}
                  className="px-4 py-1 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 transition"
                >
                  Mark Complete
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}