import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import CategoryModal from "../../components/admin/CategoryModal";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("Add");
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axiosInstance.get("/categories/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setModalMode("Add");
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setModalMode("Edit");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("accessToken");
    if (!window.confirm("Are you sure to delete this category?")) return;
    try {
      await axiosInstance.delete(`/categories/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  const handleModalSubmit = async (formData, id = null) => {
    const token = localStorage.getItem("accessToken");
    try {
      if (modalMode === "Add") {
        await axiosInstance.post("/categories/", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axiosInstance.put(`/categories/${id}/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-2xl font-bold text-purple-600">Course Categories</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          + Add Category
        </button>
      </div>

      <input
        type="text"
        placeholder="Search category..."
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 border px-3 py-2 rounded w-1/3"
      />

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((cat) => (
              <tr key={cat.id}>
                <td className="px-6 py-3">{cat.id}</td>
                <td className="px-6 py-3">{cat.name}</td>
                <td className="px-6 py-3">{cat.description}</td>
                <td className="px-6 py-3 space-x-2">
                  <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CategoryModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        category={selectedCategory}
        mode={modalMode}
      />
    </div>
  );
};

export default AdminCategories;