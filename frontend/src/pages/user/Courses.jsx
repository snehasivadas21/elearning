import { useEffect, useState } from "react";
import axiosPublic from "../../api/axiosPublic";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Users, Star, Clock, BookOpen, Filter } from "lucide-react";
import { extractResults } from "../../api/api";

const CourseListPage = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [params,setParams] = useSearchParams()

  const filters = {
    search: params.get("search") || "",
    category: params.get("category") || "",
    level: params.get("level") || "",
    ordering: params.get("ordering") || "-created_at",
    page: Number(params.get("page") || 1),
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, [params]);

  const fetchCategories = async () => {
    try {
      const res = await axiosPublic.get("/categories/");
      setCategories(extractResults(res));
    } catch (err) {
      console.error("Category fetch failed", err);
    }
  };

  const fetchCourses = async()=>{
    const res = await axiosPublic.get("/users/approved/",{params:filters});
    setCourses(extractResults(res));
    setTotalCount(res.data.count || 0);
  }

  const updateFilter = (key,value) =>{
    const newParams = Object.fromEntries(params.entries());
    if (value) newParams[key] = value;
    else delete newParams[key];
    newParams.page = 1;
    setParams(newParams);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search for courses..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-4">
          <select
            onChange={(e)=>updateFilter("category",e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">All Categories</option>
            {categories.map((c)=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select 
            onChange={(e)=>updateFilter("level",e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">All Level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <select 
            onChange={(e)=>updateFilter("ordering",e.target.value)}
            className="border p-2 rounded"
          >
            <option value="-created_at">Newest</option>
            <option value="price">Price: Low - High</option>
            <option value="-price">Price: High - Low</option>
            <option value="-rating">Top Rated</option>
          </select>
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
              <span className="absolute top-3 left-3 bg-white text-xs font-medium px-2 py-1 rounded shadow">
                {course.category_name}
              </span>
            </div>

            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-lg leading-snug line-clamp-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">{course.level}</p>
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
              </div>

              <div className="text-gray-900 font-bold text-xl">
                ₹{course.price}
              </div>  

              <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 transition">
                <BookOpen className="w-4 h-4" />
                View Course
              </button>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center gap-3 mt-8">
        <button
          disabled={filters.page === 1}
          onClick={()=>updateFilter("page",filters.page -1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
          >
          Prev
        </button>
        <button
          disabled={courses.length < 10}
          onClick={()=>updateFilter("page",filters.page +1)}
          className="px-4 py-2 border rounded"
          >
          Next
        </button>
      </div>
    </div>
  );
};

export default CourseListPage;