import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { extractResults } from "../../api/api"; 
import Pagination from "../../components/ui/Pagination";

const AdminTutors = () => {
  const [tutors, setTutors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page,setPage] = useState(1);
  const [count,setCount] = useState(0);

  const fetchTutors = async () => {
    try {
      const res = await axiosInstance.get("/admin/instructors/",{params:{page}});
      setTutors(extractResults(res));
      setCount(res.data.count)
    } catch (err) {
      console.error("Error fetching instructors:", err);
      setTutors([]);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, [page]);

  const totalPages = Math.ceil(count / 9); 

  const handleToggleStatus = async (tutor) => {
    if (!window.confirm("Are you sure to deactivate this tutor?")) return;
    try {
      await axiosInstance.patch(
        `/admin/instructors/${tutor.id}/`,
        { is_active: !tutor.is_active },
      );
      fetchTutors();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filtered = tutors.filter((t) =>
    t.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-purple-600">All Instructors</h2>

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
            {filtered.map((tutor,index) => (
              <tr key={tutor.id}>
                <td className="px-6 py-4">{index+1}</td>
                <td className="px-6 py-4">{tutor.username}</td>
                <td className="px-6 py-4">{tutor.email}</td>
                <td className="px-6 py-4">{tutor.is_active ? "Yes" : "No"}</td>
                <td className="px-6 py-4">{new Date(tutor.date_joined).toLocaleDateString()}</td>
                <td className="px-6 py-4 capitalize">{tutor.role}</td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => handleToggleStatus(tutor)}
                    className="text-yellow-600 hover:underline"
                  >
                    {tutor.is_active?"Deactivate":"Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
      page={page}
      totalPages={totalPages}
      setPage={setPage}
      />
    </div>
  );
};

export default AdminTutors;