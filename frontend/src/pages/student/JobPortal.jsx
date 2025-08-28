import { useState, useEffect } from "react";
import axios from "../../api/axios";

export default function JobPortalPage() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    axios.get("/api/jobportal/jobs/")
      .then(res => setJobs(res.data))
      .catch(err => alert(err.response.data.detail));
  }, []);

  const applyJob = async (jobId) =>{
    try {
        await axios.post("/api/jobportal/applications/",{
            job:jobId,
            resume:userProfile.resumeUrl,
        });
        alert("Application submitted");
    } catch (error) {
        alert(error.response?.data?.detail || "Error applying to job")
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Job Portal</h1>
      {jobs.length === 0 ? (
        <p>No jobs available.</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map(job => (
            <li key={job.id} className="border p-3 rounded-lg">
              <h2 className="font-semibold">{job.title}</h2>
              <p>{job.company_name}</p>
            </li>
          ))}
        </ul>
      )}
      <button 
        className="bg-green-600 text-white px-3 py-1 rounded-lg"
        onClick={()=>applyJob(job.id)}>
        Apply
      </button>
    </div>
  );
}
