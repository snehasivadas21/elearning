// src/pages/recruiter/RecruiterApplicationsPage.jsx
import { useEffect, useState } from "react";
import RecruiterSidebar from "@/components/recruiter/RecruiterSidebar";
import ApplicationList from "@/components/recruiter/ApplicationList";
import { fetchRecruiterJobs, fetchJobApplications, updateApplicationStatus } from "@/services/api";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function RecruiterApplicationsPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [resumeUrl, setResumeUrl] = useState(null);

  useEffect(() => {
    fetchRecruiterJobs().then(setJobs);
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchJobApplications(selectedJob.id).then(setApplications);
    }
  }, [selectedJob]);

  const handleStatusUpdate = async (appId, status) => {
    await updateApplicationStatus(appId, status);
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status } : a))
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <RecruiterSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Applications</h1>

        {/* Job Selector */}
        <div className="mb-4">
          <label className="mr-2 font-medium">Select Job:</label>
          <select
            className="border rounded p-2"
            value={selectedJob?.id || ""}
            onChange={(e) => {
              const job = jobs.find((j) => j.id === parseInt(e.target.value));
              setSelectedJob(job);
            }}
          >
            <option value="">-- Choose a job --</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {/* Applications List */}
        {selectedJob ? (
          <ApplicationList
            applications={applications}
            onStatusUpdate={handleStatusUpdate}
            onPreviewResume={(url) => setResumeUrl(url)}
          />
        ) : (
          <p className="text-gray-500">Select a job to view applications.</p>
        )}

        {/* Resume Preview Modal */}
        <Dialog open={!!resumeUrl} onOpenChange={() => setResumeUrl(null)}>
          <div className="bg-white p-6 rounded shadow-lg max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Resume Preview</h2>
            {resumeUrl?.endsWith(".pdf") ? (
              <iframe
                src={resumeUrl}
                title="Resume"
                className="w-full h-[500px]"
              />
            ) : (
              <img src={resumeUrl} alt="Resume" className="w-full" />
            )}
            <div className="flex justify-end mt-4">
              <Button onClick={() => setResumeUrl(null)}>Close</Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
