import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosPublic from "../../api/axiosPublic";
import CourseDetail from "../tutor/CourseDetail";


const UserCourseDetail = () => {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await axiosPublic.get(`/users/approved/${id}/`);
        setCourse(courseRes.data);

      } catch (err) {
        console.error("Failed to load course", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!course) return <p className="p-6">Course not found</p>;

  return (
    <CourseDetail
      course={course}
      role="user"
    />
  );
};

export default UserCourseDetail;
