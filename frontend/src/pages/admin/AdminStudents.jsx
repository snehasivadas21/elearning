import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

import UserModal from "../../components/admin/UserModal";

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("Add");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axiosInstance.get("/admin/students/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setModalMode("Edit");
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedStudent(null);
    setModalMode("Add");
    setShowModal(true);
  };

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

  const handleDelete = async (student) => {
    if (!window.confirm("Are you sure to deactivate this student?")) return;
    const token = localStorage.getItem("accessToken");
    try {
      await axiosInstance.patch(
        `/admin/students/${student.id}/`,
        { is_active: false },
        { headers: { Authorization: `Bearer ${token}` } }
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
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700"
        >
          + Add Student
        </button>
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
            {filtered.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4">{student.id}</td>
                <td className="px-6 py-4">{student.username}</td>
                <td className="px-6 py-4">{student.email}</td>
                <td className="px-6 py-4">{student.is_active ? "Yes" : "No"}</td>
                <td className="px-6 py-4">{student.date_joined}</td>
                <td className="px-6 py-4 capitalize">{student.role}</td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => handleEdit(student)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(student)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
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
    </div>
  );
};

export default AdminStudents;