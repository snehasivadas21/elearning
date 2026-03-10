import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { X, Plus, Trash2, User, Loader2 } from "lucide-react";

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dgqjlqivb/image/upload/v1770222854/profile-avatar.jpg";

const InputField = ({ label, name, value, onChange, type = "text", placeholder, as: Tag = "input" }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {label}
    </label>
    <Tag
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={Tag === "textarea" ? 3 : undefined}
      className="w-full px-3 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg 
                 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent 
                 placeholder:text-slate-400 resize-none transition"
    />
  </div>
);

const EditProfileDialog = ({ open, onClose, profile, onUpdate, onLinkChange }) => {
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

  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({ label: "", url: "" });
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        location: profile.location || "",
        experience: profile.experience || "",
        skills: profile.skills || "",
        date_of_birth: profile.date_of_birth || "",
        profile_image: null,
        resume: null,
      });
      setPreview(profile.profile_image_url || "");
      setLinks(profile.links || []);
    }
  }, [profile]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === "profile_image") {
      setPreview(URL.createObjectURL(files[0]));
    }
    setFormData({ ...formData, [name]: files[0] });
  };

  const handleAddLink = async () => {
    if (!newLink.label.trim() || !newLink.url.trim()) return;
    try {
      const res = await axiosInstance.post("/users/profile/links/", newLink);
      setLinks([...links, res.data]);
      setNewLink({ label: "", url: "" });
      toast.success("Link added!");
      onLinkChange();
    } catch {
      toast.error("Failed to add link.");
    }
  };

  const handleRemoveLink = async (linkId) => {
    try {
      await axiosInstance.delete(`/users/profile/links/${linkId}/`);
      setLinks(links.filter((l) => l.id !== linkId));
      toast.success("Link removed!");
      onLinkChange();
    } catch {
      toast.error("Failed to remove link.");
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        data.append(key, value);
      }
    });

    try {
      await axiosInstance.put("/users/profile/", data);
      toast.success("Profile updated successfully!");
      onUpdate();
    } catch (err) {
      toast.error("Profile update failed!");
      console.error("Update failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <Dialog.Title className="text-lg font-bold text-slate-800">
              Edit Profile
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">

            <div className="flex items-center gap-4">
              <img
                src={preview || DEFAULT_AVATAR}
                alt="avatar"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-purple-200"
              />
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Profile Image
                </label>
                <input
                  type="file"
                  name="profile_image"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 
                             file:rounded-lg file:border-0 file:text-xs file:font-semibold 
                             file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 
                             cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Jane Doe" />
              <InputField label="Headline" name="headline" value={formData.headline} onChange={handleChange} placeholder="Senior Developer" />
            </div>

            <InputField label="Bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself..." as="textarea" />

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Location" name="location" value={formData.location} onChange={handleChange} placeholder="Kochi, India" />
              <InputField label="Experience (years)" name="experience" type="number" value={formData.experience} onChange={handleChange} placeholder="3" />
            </div>

            <InputField label="Skills (comma separated)" name="skills" value={formData.skills} onChange={handleChange} placeholder="React, Python, Django" />

            <InputField label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} />

            {/* Resume */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Resume (PDF)
              </label>
              <input
                type="file"
                name="resume"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 
                           file:rounded-lg file:border-0 file:text-xs file:font-semibold 
                           file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 
                           cursor-pointer"
              />
              {profile?.resume && (
                <a href={profile.resume} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1">
                  View current resume ↗
                </a>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Links
              </label>

              {links.length > 0 && (
                <div className="space-y-2">
                  {links.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="text-xs font-semibold text-slate-500 w-20 shrink-0 truncate">{link.label}</span>
                      <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex-1 truncate">
                        {link.url}
                      </a>
                      <button
                        onClick={() => handleRemoveLink(link.id)}
                        className="text-red-400 hover:text-red-600 transition shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={newLink.label}
                  onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  placeholder="Label (e.g. GitHub)"
                  className="w-1/3 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent 
                             placeholder:text-slate-400"
                />
                <input
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://github.com/you"
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent 
                             placeholder:text-slate-400"
                />
                <button
                  onClick={handleAddLink}
                  disabled={!newLink.label.trim() || !newLink.url.trim()}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 
                             disabled:cursor-not-allowed transition shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg 
                         hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed 
                         transition flex items-center gap-2 min-w-[100px] justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditProfileDialog;