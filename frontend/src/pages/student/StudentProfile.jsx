import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import EditProfileDialog from "../../components/student/EditProfileDialog";

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/users/student/dashboard/");
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileUpdate = () => {
    axiosInstance.get("/users/profile/me/").then((res) => {
      setProfile(res.data);
      setOpen(false);
    });
  };

  if (!profile) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-bold mb-4">Student Profile</h2>

      <div className="flex items-center gap-4 mb-4">
        <img
          src={profile.profile.profile_picture?.url || "/default-profile.png"}
          alt="Profile"
          className="w-20 h-20 rounded-full object-cover border"
        />
        <div>
          <p className="font-semibold text-lg">{profile.username}</p>
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>
      </div>

      <p><strong>Bio:</strong> {profile.profile.bio || "N/A"}</p>
      <p><strong>Phone:</strong> {profile.profile.phone || "N/A"}</p>
      <p><strong>DOB:</strong> {profile.profile.dob || "N/A"}</p>

      <button
        onClick={() => setOpen(true)}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Edit Profile
      </button>

      <EditProfileDialog
        open={open}
        onClose={() => setOpen(false)}
        profile={profile.profile}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default StudentProfile;