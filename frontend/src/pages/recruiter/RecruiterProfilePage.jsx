import { useEffect, useState } from "react";
import axios from "../../api/axios"; // your axios instance with auth token

export default function RecruiterProfilePage() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    company_name: "",
    website: "",
    industry: "",
    description: "",
    contact_email: "",
    logo: null,
  });
  const [loading, setLoading] = useState(true);

  // Fetch existing profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/recruiter/profiles/");
        if (res.data.length > 0) {
          setProfile(res.data[0]);
          setFormData(res.data[0]);
        }
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) data.append(key, value);
    });

    try {
      if (profile) {
        await axios.put(`/recruiter/profiles/${profile.id}/`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`/recruiter/profiles/`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      alert("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile", error);
      alert("Error saving profile");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Recruiter Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <input
            type="text"
            name="company_name"
            value={formData.company_name || ""}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Website</label>
          <input
            type="url"
            name="website"
            value={formData.website || ""}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Industry</label>
          <input
            type="text"
            name="industry"
            value={formData.industry || ""}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            rows="4"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Contact Email</label>
          <input
            type="email"
            name="contact_email"
            value={formData.contact_email || ""}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Company Logo</label>
          <input
            type="file"
            name="logo"
            accept="image/*"
            onChange={handleChange}
            className="w-full"
          />
          {profile?.logo && (
            <img
              src={profile.logo}
              alt="Company Logo"
              className="w-20 h-20 mt-2 rounded-full object-cover"
            />
          )}
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}
