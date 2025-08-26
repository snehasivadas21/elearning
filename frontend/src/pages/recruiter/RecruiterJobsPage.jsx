import { useEffect, useState } from "react";
import axios from "../../api/axios";

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    required_skills: "",
    experience_level: "junior",
    employment_type: "full_time",
    salary_range: "",
    location: "",
  });
  const [editingJob, setEditingJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch recruiter's jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get("/recruiter/jobs/");
        setJobs(res.data);
      } catch (err) {
        console.error("Error fetching jobs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingJob) {
        await axios.put(`/recruiter/jobs/${editingJob.id}/`, {
          ...formData,
          required_skills: formData.required_skills.split(",").map(s => s.trim()),
        });
      } else {
        await axios.post("/recruiter/jobs/", {
          ...formData,
          required_skills: formData.required_skills.split(",").map(s => s.trim()),
        });
      }

      // refresh jobs
      const res = await axios.get("/recruiter/jobs/");
      setJobs(res.data);

      // reset form
      setFormData({
        title: "",
        description: "",
        required_skills: "",
        experience_level: "junior",
        employment_type: "full_time",
        salary_range: "",
        location: "",
      });
      setEditingJob(null);
    } catch (err) {
      console.error("Error saving job", err);
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      ...job,
      required_skills: job.required_skills.join(", "),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await axios.delete(`/recruiter/jobs/${id}/`);
      setJobs(jobs.filter((job) => job.id !== id));
    } catch (err) {
      console.error("Error deleting job", err);
    }
  };

  if (loading) return <p>Loading jobs...</p>;

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Job Postings</h2>

      {/* Job Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <input
          type="text"
          name="title"
          placeholder="Job Title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
          required
        />
        <textarea
          name="description"
          placeholder="Job Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
          rows="4"
          required
        />
        <input
          type="text"
          name="required_skills"
          placeholder="Required Skills (comma separated)"
          value={formData.required_skills}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />
        <div className="grid grid-cols-2 gap-4">
          <select
            name="experience_level"
            value={formData.experience_level}
            onChange={handleChange}
            className="border rounded-lg p-2"
          >
            <option value="intern">Internship</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid-level</option>
            <option value="senior">Senior</option>
          </select>
          <select
            name="employment_type"
            value={formData.employment_type}
            onChange={handleChange}
            className="border rounded-lg p-2"
          >
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
          </select>
        </div>
        <input
          type="text"
          name="salary_range"
          placeholder="Salary Range"
          value={formData.salary_range}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {editingJob ? "Update Job" : "Add Job"}
        </button>
      </form>

      {/* Job List */}
      <ul className="space-y-4">
        {jobs.map((job) => (
          <li
            key={job.id}
            className="p-4 border rounded-lg flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">{job.title}</h3>
              <p className="text-sm text-gray-600">
                {job.location} • {job.employment_type} • {job.experience_level}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Skills: {job.required_skills.join(", ")}
              </p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(job)}
                className="px-3 py-1 bg-yellow-500 text-white rounded-lg"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(job.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
