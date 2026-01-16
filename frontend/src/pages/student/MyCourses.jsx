import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { Users, Star, Clock, BookOpen } from "lucide-react";
import CourseProgressBar from "../../components/student/CourseProgressBar";
import { extractResults } from "../../api/api";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const res = await axiosInstance.get("/payment/purchase/");
        const purchases = extractResults(res);

        const coursesWithDetails = await Promise.all(
          purchases.map(async (p)=>{
            const courseRes = await axiosInstance.get(`/users/my-courses/${p.course.id}/`);
            return courseRes.data;
          })
        )
        setCourses(coursesWithDetails);
      } catch (err) {
        console.error("Failed to fetch enrolled courses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  if (loading) {
    return <p className="p-8 text-gray-500">Loading your courses...</p>;
  }

  if (!courses.length) {
    return (
      <div className="p-8 text-center text-gray-600">
        You haven’t enrolled in any courses yet.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-purple-600">My Courses</h1>
      <p className="text-gray-500 mb-6">
        {courses.length} enrolled course{courses.length > 1 && "s"}
      </p>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition"
          >
            <div className="relative">
              <img
                src={course.course_image}
                alt={course.title}
                className="w-full h-44 object-cover"
              />
              <span className="absolute top-3 left-3 bg-white text-xs font-medium px-2 py-1 rounded shadow">
                {course.category_name}
              </span>
            </div>

            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-lg line-clamp-2">
                {course.title}
              </h3>

              <p className="text-sm text-gray-600">
                By {course.instructor_username}
              </p>

              <div className="flex items-center text-sm gap-4 text-gray-500 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {course.rating ?? "4.5"}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.students_count ?? "10,000"}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.duration ?? "12h"}
                </div>
              </div>

              <CourseProgressBar
                percentage={course.progress_percentage ?? 0}
              />

              <button
                onClick={() => navigate(`/student/mycourses/${course.id}`)}
                className="mt-4 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
              >
                View Course
              </button>

              <button
                onClick={() => navigate(`/courses`)}
                className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
              >
                <BookOpen className="w-4 h-4" />
                Continue Learning
              </button>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCourses;
