import React, { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosInstance';
import { Users, Star, Clock, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate()

  const discountPercent = (original, current) => {
    if (!original || !current || original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  };

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const res = await axiosInstance.get("/payments/purchase/");
        const courseList = res.data.map((enrollment) => enrollment.course);
        setCourses(courseList);
      } catch (err) {
        console.error("Failed to fetch enrolled courses", err);
      }
    };
    fetchEnrolledCourses();
  }, []);

  if (!courses.length) return (
    <div className="p-8 text-center text-gray-600">
      You haven't enrolled in any courses yet.
    </div>
  );

  const handleChatClick = () =>{
    navigate(`/chat/${courses.id}`)
  }

  return (
    <div>
      <h1 className='text-2xl font-bold mb-6'>My Enrolled Courses</h1>
      <p className="text-gray-500 mb-6">{courses.length} courses found</p>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
        {courses.map((course) => (
          <Link
            to={`/courses/${course.id}`}
            key={course.id}
            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
          >
            <div className="relative">
              <img
                src={course.course_image}
                alt={course.title}
                className="w-full h-44 object-cover"
              />
              {discountPercent(course.original_price, course.price) > 0 && (
                <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{discountPercent(course.original_price, course.price)}%
                </span>
              )}
              <span className="absolute top-3 left-3 bg-white text-xs font-medium px-2 py-1 rounded shadow">
                {course.category_name}
              </span>
            </div>

            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-lg leading-snug line-clamp-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
              <p className="text-sm text-gray-600">By {course.instructor_username}</p>

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

              <div className="flex items-center justify-between mt-3">
                <div className="text-gray-900 font-bold text-xl">
                  {course.is_free ? "Free" : `₹${course.price}`}
                  {course.original_price && (
                    <span className="ml-2 line-through text-sm text-gray-500">
                      ₹{course.original_price}
                    </span>
                  )}
                </div>
              </div>

              <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 transition">
                <BookOpen className="w-4 h-4" />
                Continue Learning
              </button>
              <button className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700' onClick={handleChatClick}>
                Chat with Instructor
              </button>
              {course.live_session?.join_url && (
                <Link
                  to={`/live-session/${course.live_session.join_url}`}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Join Now
                </Link>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MyCourses;