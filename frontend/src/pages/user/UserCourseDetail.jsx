import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosPublic from "../../api/axiosPublic";
import CourseDetail from "../tutor/CourseDetail";
import { toast } from "react-toastify";
import axiosInstance from "../../api/axiosInstance";

const UserCourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate()

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(null);

  const isLoggedIn = !!localStorage.getItem("access");

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

  useEffect(() => {
    if (!isLoggedIn || !course?.id) return;

    const checkEnrollment = async () => {
      try {
        const res = await axiosInstance.get("/payment/purchase/",{
            params: { course_id : course.id},
        })
        setIsEnrolled(res.data.length > 0);
      } catch (err) {
        console.error("Enrollment check failed", err);
      }
    };
      checkEnrollment();
  }, [course?.id, isLoggedIn]);

  const handleBuyNow = async () => {
    try {
      const res = await axiosInstance.post("payment/create-order/", {
        course_id: course.id,
      });

      const { razorpay_order_id, amount, currency, key } = res.data;

      const options = {
        key,
        amount,
        currency,
        name: "PyTech",
        description: course.title,
        order_id: razorpay_order_id,
        handler: async function (response) {
          try {
              await axiosInstance.post("payment/verify-payment/", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment successful! Course unlocked.");
            setIsEnrolled(true);
            navigate(`/mycourses/${course.id}`)
          } catch (err) {
            console.error("Verification failed", err);
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: "Student",
          email: "student@example.com",
        },
        theme: {
          color: "#6366f1",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Buy now failed", err);
      toast.error("Payment failed or canceled.");
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!course) return <p className="p-6">Course not found</p>;

  return (
    <>
      <CourseDetail course={course} role="user"/>
      
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white border shadow rounded-xl p-6 h-fit">
        <div className="text-3xl font-bold text-gray-900">
          ₹ {course.price}
        </div>

        {!isLoggedIn ? (
          <button onClick={() => navigate("/login")} className="w-full py-3 bg-gray-500 text-white rounded">
            Login to Enroll
          </button>
        ) : isEnrolled === null ? (
          <button className="w-full py-3 bg-gray-200 rounded cursor-wait">
            Checking enrollment...
          </button>
        ) : isEnrolled ? (
          <button disabled className="w-full py-3 bg-gray-400 text-white rounded">
            Already Enrolled
          </button>
        ) : (
          <button
            onClick={handleBuyNow}
            className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Buy Now ₹ {course.price}
          </button>
        )}

        
        <div className="mt-6 text-sm text-gray-600 space-y-2">
          <div>📺 {course.duration || "15 hours"} on-demand video</div>
          <div>📄 8 downloadable resources</div>
          <div>📜 Certificate of completion</div>
          <div>🔒 Full lifetime access</div>
          <div>📱 Access on mobile and TV</div>
        </div>
      </div>
      </div>
    </>
  );
};

export default UserCourseDetail;
