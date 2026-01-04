import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";

const EditProfileDialog = ({ open, onClose, profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    full_name: "",
    headline: "",
    bio: "",
    location: "",
    experience: "",
    skills: "",
    date_of_birth: "",
    profile_image: null,
    resume: null,
  });

  const [preview, setPreview] = useState("");

  useEffect(()=>{
    if (profile){
      setFormData({
        full_name:profile.full_name || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        location: profile.location || "",
        experience: profile.experience || "",
        skills: profile.skills || "",
        date_of_birth: profile.date_of_birth || "",
        profile_image: null,
        resume: null,
      })
      setPreview(profile.profile_image || "");
    }
  },[profile])

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) =>{
    const {name,files} = e.target;
    if (name === "profile_image"){
      setPreview(URL.createObjectURL(files[0]));
    }
    setFormData({...formData,[name]:files[0]});
  }

  const handleSubmit = async () => {
    const data = new FormData();

    Object.entries(formData).forEach(([key,value])=>{
      if (value !== null && value !== ""){
        data.append(key,value);
      }
    })

    try {
      await axiosInstance.put("/users/profile/", data);
      toast.success("Profile updated successfully!")
      onUpdate(); 
    } catch (err) {
      toast.error("Profile update failed!")
      console.error("Update failed:", err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded bg-white p-6 shadow-xl space-y-4">
          <Dialog.Title className="text-lg font-bold">Edit Profile</Dialog.Title>

          <input
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Full Name"
            className="input"
          />
          <input
            name="headline"
            value={formData.headline}
            onChange={handleChange}
            placeholder="Headline"
            className="input"
          />
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Short bio"
            className="input"
          />
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Location"
            className="input"
          />
          <input
            name="experience"
            type="number"
            value={formData.experience}
            onChange={handleChange}
            placeholder="Experience (years)"
            className="input"
          />
          <input
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            placeholder="Skills (comma separated)"
            className="input"
          />
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            className="input"
          />

          <div>
            <label className="text-sm">Profile Image</label>
            <input
              type="file"
              name="profile_image"
              onChange={handleFileChange}
              accept="image/*"
              className="w-full"
            />
            {preview && (
              <img
                src={preview}
                className="w-16 h-16 mt-2 rounded-full object-cover"
              />
            )}
          </div>

          <div>
            <label className="text-sm">Resume (PDF)</label>
            <input
              type="file"
              name="resume"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full"
            />
          </div>

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