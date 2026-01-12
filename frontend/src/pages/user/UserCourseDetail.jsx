import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosPublic from "../../api/axiosPublic";
import CourseDetail from "../tutor/CourseDetail";
import { toast } from "react-toastify";
import axiosInstance from "../../api/axiosInstance";

const UserCourseDetail = () => {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollLoading,setEnrollLoading] = useState(true);
  const [certificate,setCertificates] = useState(null);
  const [orderId,setOrderId] = useState(null);

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
    const checkEnrollment = async () => {
      setEnrollLoading(true);
      try {
        const res = await axiosInstance.get("/payment/purchase/");
        const enrolledCourses = res.data.map((en) => en.course);
        setIsEnrolled(enrolledCourses.includes(course.id));
      } catch (err) {
        console.error("Enrollment check failed", err);
      }finally {
        setEnrollLoading(false)
      }
    };
    if (course?.id && isLoggedIn) {
      checkEnrollment();
    }
  }, [course?.id, isLoggedIn]);

  const handleEnroll = async () => {
    try {
      await axiosInstance.post("payment/purchase/", {
        course: course.id,
      });
      toast.success("Enrolled successfully!");
      setIsEnrolled(true);
    } catch (error) {
      console.error(error);
      toast.error("Enrollment failed or already enrolled.");
    }
  };

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
        name: "PyTech Academy",
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
            setOrderId(response.razorpay_order_id);
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

  const handleDownloadInvoice = async () => {
    try {
      const response = await axiosInstance.get(`/invoices/${orderId}/download/`, {
        responseType: "blob", // Important for files
      });

      // Create blob link for download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Invoice download failed", error);
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
          {course.is_free ? "Free" : `₹${course.price}`}
          {course.original_price && (
            <span className="ml-2 text-lg text-gray-400 line-through">
              ₹{course.original_price}
            </span>
          )}
        </div>

        {course.original_price && (
          <p className="text-green-600 text-sm mt-1">
            Save {Math.round(((course.original_price - course.price) / course.original_price) * 100)}% today!
          </p>
        )}

        {isLoggedIn && course ? (
          enrollLoading ? (
            <button className="mt-6 bg-gray-200 text-gray-700 font-medium w-full py-3 rounded cursor-wait">
              Checking Enrollment...
            </button>
          ):!isEnrolled ? (
            course.is_free ? (
              <button
                onClick={handleEnroll}
                className="mt-6 bg-blue-600 text-white font-medium w-full py-3 rounded hover:bg-blue-700 transition"
              >
                Enroll Now
              </button>
            ) : (
              <button
                onClick={handleBuyNow}
                className="mt-6 bg-green-600 text-white font-medium w-full py-3 rounded hover:bg-green-700 transition"
              >
                Buy Now ₹{course.price}
              </button>
            )
          ) : (
            <button className="mt-6 bg-gray-400 text-white font-medium w-full py-3 rounded cursor-not-allowed">
              Already Enrolled
            </button>
          )
        ) : (
          <button
            onClick={() => (window.location.href = "/login")}
            className="mt-6 bg-gray-400 text-white font-medium w-full py-3 rounded hover:bg-gray-500"
          >
            Login to Enroll
          </button>
        )}

        {certificate?.has_certificate ? (
          <a href={certificate.download_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 text-white rounded">
            Download Certifate
          </a>
        ) : (
          <p className="text-gray-500">Complete all lessons to unlock certificate</p>
        )}
        
        {orderId && (
          <button
            onClick={handleDownloadInvoice}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
          >
            Download Invoice
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
