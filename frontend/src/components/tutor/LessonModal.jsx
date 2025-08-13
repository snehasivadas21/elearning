import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

const LessonModal = ({
  show,
  onClose,
  onSubmit,
  lessonData = null,
  moduleId,
  mode = "Add",
}) => {
  const [formData, setFormData] = useState({
    title: "",
    content_type: "video",
    content_url: "",
    order: 1,
    is_preview: false,
    is_active: true,
  });

  const [resourceFiles,setResourceFiles] = useState([]);
  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    if (lessonData) {
      setFormData({
        title: lessonData.title || "",
        content_type: lessonData.content_type || "video",
        content_url: lessonData.content_url || "",
        order: lessonData.order || 1,
        is_preview: lessonData.is_preview || false,
        is_active: lessonData.is_active ?? true,
      });
    }
  }, [lessonData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setResourceFiles(Array.from(e.target.files))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      module: moduleId,
    };

    try {
      const url = lessonData
        ? `/courses/lessons/${lessonData.id}/`
        : "/courses/lessons/";
      const method = lessonData ? axiosInstance.put : axiosInstance.post;

      const lessonRes = await method(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const lessonId = lessonData?.id || lessonRes.data.id;

      // Upload resources if any
      if (resourceFiles.length > 0) {
        const uploadPromises = resourceFiles.map((file) => {
          const formData = new FormData();
          formData.append("lesson", lessonId);
          formData.append("title", file.name);
          formData.append("file", file);

          return axiosInstance.post("/courses/lesson-resources/", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
        });

        await Promise.all(uploadPromises);
      }

      setResourceFiles([]);
      onClose();
    } catch (err) {
      console.error("Error saving lesson or resources:", err);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[450px]">
        <h3 className="text-xl font-bold mb-4">{mode} Lesson</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Lesson Title"
            className="w-full border px-3 py-2 rounded"
            required
          />

          <select
            name="content_type"
            value={formData.content_type}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="video">Video</option>
            <option value="text">Text</option>
          </select>

          <input
            name="content_url"
            value={formData.content_url}
            onChange={handleChange}
            placeholder={
              formData.content_type === "video"
                ? "Video URL"
                : "Text or Link to content"
            }
            className="w-full border px-3 py-2 rounded"
          />

          <div>
            <label className="block font-medium text-sm mb-1">
              Upload Resources (PDF, DOCX, PPTX):
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.pptx"
              onChange={handleFileChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            placeholder="Order"
            className="w-full border px-3 py-2 rounded"
          />

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                name="is_preview"
                checked={formData.is_preview}
                onChange={handleChange}
              />
              <span>Preview</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <span>Active</span>
            </label>
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
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonModal;