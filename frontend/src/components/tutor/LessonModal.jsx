import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

const LessonModal = ({show,onClose,lessonData = null,moduleId,mode = "Add"}) => {
  const [formData, setFormData] = useState({
    title: "",
    content_type: "video",
    content_url: "",
    order: 1,
    is_preview: false,
    is_active: true,
  });

  const [resourceFiles,setResourceFiles] = useState([]);

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
    if(name==="content_type"){
      setFormData((prev)=>({
        ...prev,
        content_type:value,
        content_url:"",
        is_preview:value === "video"?prev.is_preview:false,
      }))
      return;
    }
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

    if (!formData.title.trim()){
      alert("Lesson title is required");
      return;
    }

    if (!formData.content_url.trim()){
      alert(
        formData.content_type === "video"
        ? "Video URL is required" : "Text content is required"
      )
      return;
    }

    const payload = {
      title:formData.title,
      content_type:formData.content_type,
      content_url:formData.content_url,
      module:moduleId,
    };

    try {
      const url = lessonData
        ? `/lessons/${lessonData.id}/`
        : "/lessons/";
      const method = lessonData ? axiosInstance.put : axiosInstance.post;

      const lessonRes = await method(url, payload);

      const lessonId = lessonData?.id || lessonRes.data.id;

      if (resourceFiles.length > 0) {
        await Promise.all(
          resourceFiles.map((file) => {
            const fd = new FormData();
            fd.append("lesson", lessonId);
            fd.append("title", file.name);
            fd.append("file", file);

            return axiosInstance.post("/lesson-resources/", fd);
          })
        );
      }

      setResourceFiles([]);
      onClose();
    } catch (err) {
      console.error("Error saving lesson or resources:", err.response?.data);
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

          {formData.content_type === "video"?(
            <input 
              name="content_url"
              value={formData.content_url}
              onChange={handleChange}
              placeholder="Video URL" 
              className="w-full border px-3 py-2 rounded"/>
          ) : (
            <textarea 
              name="content_url"
              value={formData.content_url}
              onChange={handleChange}
              placeholder="Lesson text content"
              rows={4}
              className="w-full border px-3 py-2 rounded"/>
          )}

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
                disabled={formData.content_type!=="video"}
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
              className="px-4 py-2 bg-yellow-600 text-white rounded"
            >
              Save as Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonModal;