import { useState, useEffect } from "react";

const ModuleModal = ({ show, onClose, onSubmit, mode = "Add", moduleData = null }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: 1,
    is_active: true,
    status:"draft",
  });

  useEffect(() => {
    if (moduleData) {
      setFormData({
        title: moduleData.title || "",
        description: moduleData.description || "",
        order: moduleData.order || 1,
        is_active: moduleData.is_active ?? true,
        status:"draft",
      });
    }
  }, [moduleData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e,statusOverride = null)=>{
    if (e) e.preventDefault();
    const submitData = new FormData();
    Object.entries(formData).forEach(([key,value])=>{
      if (key === "status") return;
      if (value !== null && value !== undefined){
        submitData.append(key,value)
      }
    })
    submitData.set("status",statusOverride ?? formData.status);
    if (formData.course){
      submitData.set("course",formData.course)
    }
    onSubmit(submitData,moduleData?.id)
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[450px]">
        <h3 className="text-xl font-bold mb-4">{mode} Module</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Module Title"
            className="w-full border px-3 py-2 rounded"
            required
          />

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Module Description"
            className="w-full border px-3 py-2 rounded"
          />

          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            placeholder="Order (e.g., 1, 2...)"
            className="w-full border px-3 py-2 rounded"
            min={1}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            <span>Active</span>
          </label>

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
              Cancel
            </button>
            <button type="submit" onClick={(e) => handleSubmit(e,"draft")} className="px-4 py-2 bg-yellow-600 text-white rounded">
              Save as Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModuleModal;