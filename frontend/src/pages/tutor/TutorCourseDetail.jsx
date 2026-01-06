import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import CourseDetail from "./CourseDetail";
import axiosInstance from "../../api/axiosInstance";
import { extractResults } from "../../api/api";

const TutorCourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    const fetchCourseAndModules = async () => {
      try {
        const [courseRes, modulesRes] = await Promise.all([
          axiosInstance.get(`/instructor/courses/${id}/`),
          axiosInstance.get(`/modules/?course=${id}`)
        ]);

        setCourse({
          ...courseRes.data,
          modules: extractResults(modulesRes),
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchCourseAndModules();
  }, [id]);

  return <CourseDetail course={course} />;
};

export default TutorCourseDetail;
