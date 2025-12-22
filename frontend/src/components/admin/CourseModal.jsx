import React, { useState, useEffect } from 'react';
import axiosInstance from "../../api/axiosInstance";

const CourseModal = ({ show, onClose, onSubmit, course, mode = "Add" }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level:'beginner',
    is_active: true,
    price: 0.00,
    course_image: null,
  });

  const [preview, setPreview] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
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
    if (show) fetchCategories();
  }, [show]);

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        category: course.category ?.id || '',
        level: course.level || 'beginner',
        is_active: course.is_active ?? true,
        price: course.price ?? 0.00,
        course_image: null,
      });
      setPreview(course?.course_image ?? null);
    } else {
      setFormData({
        title: '',
        description: '',
        category: '',
        level: '',
        is_active: true,
        price: 0.00,
        course_image: null,
      });
      setPreview(null);
    }
  }, [course]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        course_image: file,
      }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e,statusOverride = "submitted") => {
    if (e) e.preventDefault();
    const submitData = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        submitData.append(key, value);
      }
    });
    submitData.set("status",statusOverride)

    onSubmit(submitData, course?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
        <h3 className="text-xl font-bold mb-4">{mode} Course</h3>
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4" encType="multipart/form-data">
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Course Title"
            className="w-full border px-3 py-2 rounded"
            required
          />

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Course Description"
            className="w-full border px-3 py-2 rounded"
            required
          />

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select 
            name="level" 
            value={formData.level}
            onChange={handleChange}
            required
            className='w-full border px-3 py-2 rounded'
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <label className="block">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            <span className="ml-2">Is Active</span>
          </label>

          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Course Price"
            className="w-full border px-3 py-2 rounded"
            min="0"
            step="0.01"
            required
          />
          

          <div>
            <label className="block mb-1 font-medium">Course Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 w-32 h-20 object-cover border rounded"
              />
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, "draft")}
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              Save as Draft
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded"
            >
              Submit for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseModal;