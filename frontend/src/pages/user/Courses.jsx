import { useEffect, useState } from "react";
import axiosPublic from "../../api/axiosPublic";
import { Link } from "react-router-dom";
import { Search, Users, Star, Clock, BookOpen, Filter } from "lucide-react";
import { extractResults } from "../../api/api";

const CourseListPage = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [searchTerm, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await axiosPublic.get("/categories/");
      setCategories(extractResults(res));
    } catch (err) {
      console.error("Category fetch failed", err);
    }
  };

  const fetchCourses = async () => {
    try {
      let url = `/users/approved/?ordering=title`;
      if (searchTerm) url += `&search=${searchTerm}`;
      if (selectedCategory !== "All") url += `&category=${selectedCategory}`;
      const res = await axiosPublic.get(url);
      setCourses(extractResults(res));
    } catch (err) {
      console.error("Course fetch error", err);
    }
  };

  const discountPercent = (original, price) => {
    if (!original || original <= price) return 0;
    return Math.round(((original - price) / original) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search for courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-700">Categories</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                selectedCategory === "All"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              All Courses
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  selectedCategory === cat.name
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      
      <h2 className="text-2xl font-bold mb-2">All Courses</h2>
      <p className="text-gray-500 mb-6">{courses.length} courses found</p>

      
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in">
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
                View Course
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CourseListPage;