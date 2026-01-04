import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

import UserModal from "../../components/admin/UserModal";
import { extractResults } from "../../api/api";
import Pagination from "../../components/ui/Pagination";

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("Add");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page,setPage] = useState(1);
  const [count,setCount] = useState(0);

  const fetchStudents = async () => {
    try {
      const res = await axiosInstance.get("/admin/students/",{params:{page}});
      setStudents(extractResults(res));
      setCount(res.data.count)
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudents([]);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page]);

  const handleModalSubmit = async (data, id = null) => {
    const token = localStorage.getItem("accessToken");
    try {
      if (modalMode === "Add") {
        await axiosInstance.post("/admin/students/", data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axiosInstance.put(`/admin/students/${id}/`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleToggleStatus = async (student) => {
    if (!window.confirm("Are you sure to deactivate this student?")) return;
    try {
      await axiosInstance.patch(
        `/admin/students/${student.id}/`,
        { is_active: !student.is_active },
      );
      fetchStudents();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filtered = students.filter((s) =>
    s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-purple-600">All Students</h2>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by username/email"
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-3 py-2 rounded w-1/3"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Username</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Active</th>
              <th className="px-6 py-3">Date Joined</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filtered.map((student,index) => (
              <tr key={student.id}>
                <td className="px-6 py-4">{index+1}</td>
                <td className="px-6 py-4">{student.username}</td>
                <td className="px-6 py-4">{student.email}</td>
                <td className="px-6 py-4">{student.is_active ? "Yes" : "No"}</td>
                <td className="px-6 py-4">{new Date(student.date_joined).toLocaleDateString()}</td>
                <td className="px-6 py-4 capitalize">{student.role}</td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => handleToggleStatus(student)}
                    className="text-yellow-600 hover:underline"
                  >
                    {student.is_active?"Deactivate":"Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        user={selectedStudent}
        mode={modalMode}
        type="Student"
      />
      <Pagination
       page={page}
       setPage={setPage}
       count={count}
      />
    </div>
  );
};

export default AdminStudents;