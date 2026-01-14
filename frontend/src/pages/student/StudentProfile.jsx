import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import EditProfileDialog from "../../components/student/EditProfileDialog";

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading,setLoading] = useState(true);
  const skills = profile?.skills ? profile.skills.split(",") : [];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/users/profile/");
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileUpdate = () => {
    axiosInstance.get("/users/profile/").then((res) => {
      setProfile(res.data);
      setOpen(false);
    });
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className='text-2xl font-bold text-purple-600'>My Profile</h1>

      <div className="flex items-center gap-6 bg-white p-6 rounded-xl shadow">
        <img
          src={profile.profile_image || "/avatar.png"}
          alt="profile"
          className="w-28 h-28 rounded-full object-cover"
        />

        <div>
          <h1 className="text-xl font-bold">{profile.full_name}</h1>
          <p className="text-gray-600 mt-1">{profile.headline}</p>

          <button
            onClick={() => setOpen(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">About</h2>

        <p className="text-gray-700 leading-relaxed">{profile.bio || "No bio added yet."}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Basic Info</h2>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-500">Location</p>
            <p className="font-medium">{profile.location || "—"}</p>
          </div>

          <div>
            <p className="text-gray-500">Experience</p>
            <p className="font-medium">
              {profile.experience ? `${profile.experience} years` : "—"}
            </p>
          </div>
        </div>
      </div>
      

      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Skills</h3>

        <div className="flex flex-wrap gap-2">
          {skills.length > 0 ? (
            skills.map((skill, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border"
              >
                {skill.trim()}
              </span>
            ))
          ) : (
            <p className="text-gray-500">No skills added</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Links</h3>

        {profile.links?.length ? (
          <ul className="space-y-2">
            {profile.links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No links added</p>
        )}
      </div>

      {profile.resume && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Resume</h3>
          <a
            href={profile.resume}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 font-medium hover:underline"
          >
            View Resume
          </a>
        </div>
      )}

      

      <EditProfileDialog
        open={open}
        onClose={() => setOpen(false)}
        profile={profile}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default StudentProfile;