import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { extractResults } from "../../api/api";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/ui/Pagination";

const ConfirmModal = ({ isOpen, title, message, confirmLabel, confirmColor, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg text-white ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const [modal, setModal] = useState({
    isOpen: false,
    courseId: null,
    action: null, // 'unlist' | 'relist'
    courseTitle: "",
  });

  const totalPages = Math.ceil(count / 9);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      const res = await axiosInstance.get("/admin/courses/", { params: { page } });
      setCourses(extractResults(res));
      setCount(res.data.count);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page]);

  const openModal = (courseId, courseTitle, action) => {
    setModal({ isOpen: true, courseId, courseTitle, action });
  };

  const closeModal = () => {
    setModal({ isOpen: false, courseId: null, action: null, courseTitle: "" });
  };

  const handleConfirm = async () => {
    const { courseId, action } = modal;
    closeModal();
    try {
      await axiosInstance.patch(`/admin/courses/${courseId}/${action}/`);
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, is_published: action === "relist" } : c
        )
      );
    } catch (err) {
      console.error(`Error during ${action}:`, err);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = searchStatus ? course.status === searchStatus : true;

    return matchesSearch && matchesStatus;
  });

  const modalConfig = {
    unlist: {
      title: "Unlist Course?",
      message: `"${modal.courseTitle}" will be hidden from the catalog. Existing students will still have full access.`,
      confirmLabel: "Yes, Unlist",
      confirmColor: "bg-orange-500 hover:bg-orange-600",
    },
    relist: {
      title: "Relist Course?",
      message: `"${modal.courseTitle}" will be visible in the catalog again and open for new enrollments.`,
      confirmLabel: "Yes, Relist",
      confirmColor: "bg-green-600 hover:bg-green-700",
    },
  };

  const active = modal.action ? modalConfig[modal.action] : {};

  return (
    <div className="p-6">
      <ConfirmModal
        isOpen={modal.isOpen}
        title={active.title}
        message={active.message}
        confirmLabel={active.confirmLabel}
        confirmColor={active.confirmColor}
        onConfirm={handleConfirm}
        onCancel={closeModal}
      />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">All Courses</h2>
      </div>

      <input
        type="text"
        placeholder="Search by title/instructor"
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 border px-3 py-2 rounded w-1/3"
      />

      <select
        className="ml-2 border px-2 py-1 rounded"
        onChange={(e) => setSearchStatus(e.target.value)}
      >
        <option value="">All</option>
        <option value="submitted">Submitted</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      <div className="overflow-x-auto bg-white rounded-lg shadow mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Instructor</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Active</th>
              <th className="px-6 py-3">Published</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCourses.map((course, index) => (
              <tr key={course.id} className="border-t">
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-6 py-4">{course.title}</td>
                <td className="px-6 py-4">{course.instructor_username}</td>
                <td className="px-6 py-4">{course.category_name || course.category}</td>
                <td className="px-6 py-4">₹{course.price}</td>
                <td className="px-6 py-4 capitalize">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      course.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : course.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {course.status}
                  </span>
                </td>
                <td className="px-6 py-4">{course.is_active ? "Yes" : "No"}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      course.is_published
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {course.is_published ? "Listed" : "Unlisted"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => navigate(`/admin/courses/${course.id}`)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      View
                    </button>

                    {course.status === "approved" && (
                      course.is_published ? (
                        <button
                          onClick={() => openModal(course.id, course.title, "unlist")}
                          className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                        >
                          Unlist
                        </button>
                      ) : (
                        <button
                          onClick={() => openModal(course.id, course.title, "relist")}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          Relist
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
};

export default AdminCourses;