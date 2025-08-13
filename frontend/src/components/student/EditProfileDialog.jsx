import { Dialog } from "@headlessui/react";
import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";

const EditProfileDialog = ({ open, onClose, profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    bio: profile?.bio || "",
    phone: profile?.phone || "",
    dob: profile?.dob || "",
    profile_picture: null,
  });

  const [preview, setPreview] = useState(profile?.profile_picture || "");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImage = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, profile_picture: file });
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    const data = new FormData();
    data.append("bio", formData.bio);
    data.append("phone", formData.phone);
    data.append("dob", formData.dob);
    if (formData.profile_picture) {
      data.append("profile_picture", formData.profile_picture);
    }

    try {
      await axiosInstance.put("/users/profile/me/", data);
      toast.success("Profile updated successfully!")
      onUpdate(); 
    } catch (err) {
      toast.error("Profile update failed!")
      console.error("Update failed:", err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded bg-white p-6 shadow-xl space-y-4">
          <Dialog.Title className="text-lg font-bold">Edit Profile</Dialog.Title>

          <input
            type="text"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Bio"
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />

          <input
            type="file"
            onChange={handleImage}
            accept="image/*"
            className="w-full text-sm text-gray-500"
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-16 h-16 rounded-full object-cover border"
            />
          )}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditProfileDialog;