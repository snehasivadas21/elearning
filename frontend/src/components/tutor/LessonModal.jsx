import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";

const uploadVideoToCloudinary = async (file) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "video_upload_unsigned");
  data.append("resource_type", "video");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dgqjlqivb/video/upload",
    {
      method: "POST",
      body: data,
    }
  );

  const result = await res.json();
  console.log("Cloudinary upload response:", result);
  if (!result.secure_url) {
    throw new Error("Video upload failed");
  }
  return {
    url: result.secure_url,
    duration: Math.floor(result.duration)
  };

};
const LessonModal = ({show,onClose,lessonData = null,moduleId}) => {
  const [formData, setFormData] = useState({
    title: "",
    content_type: "video",
    video_source: "youtube", 
    video_url: "",
    video_file: null,
    text_content: "",
    order: 1,
    is_preview: false,
    is_active: true,
  });

  const [resourceFiles, setResourceFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lessonData) {
      setFormData({
        title: lessonData.title || "",
        content_type: lessonData.content_type || "video",
        video_source: lessonData.video_source || "youtube",
        video_url: lessonData.video_url || "",
        video_file: null,
        text_content: lessonData.text_content || "",
        order: lessonData.order || 1,
        is_preview: lessonData.is_preview || false,
        is_active: lessonData.is_active ?? true,
      });
    }
  }, [lessonData]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "content_type") {
      setFormData((prev) => ({
        ...prev,
        content_type: value,
        video_source: value === "video" ? "youtube" : "",
        video_url: "",
        video_file: null,
        text_content: "",
        is_preview: value === "video" ? prev.is_preview : false,
      }));
      return;
    }

    if (name === "video_source") {
      setFormData((prev) => ({
        ...prev,
        video_source: value,
        video_url: "",
        video_file: null,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleVideoFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      video_file: e.target.files[0],
    }));
  };

  const handleResourceChange = (e) => {
    setResourceFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    if (formData.content_type === "video") {
      if (formData.video_source === "youtube" && !formData.video_url.trim()) {
        toast.error("Video URL is required");
        return;
      }
      if (formData.video_source === "cloud" && !formData.video_file) {
        toast.error("Please upload a video file");
        return;
      }
    }

    if (formData.content_type === "text" && !formData.text_content.trim()) {
      toast.error("Text content is required");
      return;
    }

    try {
      setSubmitting(true);

      // let finalVideoUrl = formData.video_url;

      // if (formData.content_type === "video" && formData.video_source === "cloud") {
      //   const uploadData = await uploadVideoToCloudinary(formData.video_file);
      //   finalVideoUrl = uploadData.url;
      //   var videoDuration = uploadData.duration;
      // }

      let finalVideoUrl = formData.video_url; // ← existing URL from DB
      let videoDuration = null;

      if (formData.content_type === "video" && formData.video_source === "cloud") {
        if (formData.video_file) {
          // ✅ only upload if a NEW file was actually selected
          const uploadData = await uploadVideoToCloudinary(formData.video_file);
          finalVideoUrl = uploadData.url;
          videoDuration = uploadData.duration;
        }
        // else: no new file chosen → finalVideoUrl stays as existing URL
      }

      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("module", moduleId);
      payload.append("content_type", formData.content_type);
      payload.append("order", formData.order);
      payload.append("is_preview", formData.is_preview);
      payload.append("is_active", formData.is_active);

      if (formData.content_type === "video") {
        payload.append("video_source", formData.video_source);
        payload.append("video_url",finalVideoUrl);
        if (formData.video_source === "cloud" && videoDuration) {
          payload.append("duration", videoDuration);
        }
      }

      if (formData.content_type === "text") {
        payload.append("text_content", formData.text_content);
      }

      const lessonRes = lessonData
        ? await axiosInstance.patch(`/lessons/${lessonData.id}/`, payload)
        : await axiosInstance.post("/lessons/", payload);

      const lessonId = lessonData?.id || lessonRes.data.id;

      for (const file of resourceFiles) {
        const fd = new FormData();
        fd.append("lesson", lessonId);
        fd.append("title", file.name);
        fd.append("file", file);

        await axiosInstance.post("/lesson-resources/", fd);
      }

      toast.success(
        lessonData ? "Lesson updated successfully!" : "Lesson created successfully!"
      );

      setResourceFiles([]);
      onClose();
    } catch (err) {
      console.error("Lesson save failed:", err);
      toast.error("Failed to save lesson. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[480px]">
        <h3 className="text-xl font-bold mb-4">{lessonData ? "Edit Lesson" : "Add Lesson"}</h3>

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

          {formData.content_type === "video" && (
            <>
              <select
                name="video_source"
                value={formData.video_source}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="youtube">YouTube / External URL</option>
                <option value="cloud">Upload Video</option>
              </select>

              {formData.video_source === "youtube" && (
                <input
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleChange}
                  placeholder="YouTube / Video URL"
                  className="w-full border px-3 py-2 rounded"
                />
              )}

              {formData.video_source === "cloud" && (
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="w-full border px-3 py-2 rounded"
                />
              )}
            </>
          )}

          {formData.content_type === "text" && (
            <textarea
              name="text_content"
              value={formData.text_content}
              onChange={handleChange}
              placeholder="Lesson text content"
              rows={4}
              className="w-full border px-3 py-2 rounded"
            />
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Upload Resources (PDF, DOCX, PPTX)
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.pptx"
              onChange={handleResourceChange}
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
                disabled={formData.content_type !== "video"}
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
              disabled={submitting}
              className={`px-4 py-2 rounded text-white ${
                submitting
                  ? "bg-yellow-400 cursor-not-allowed"
                  : "bg-yellow-600 hover:bg-yellow-700"
              }`}
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonModal;
