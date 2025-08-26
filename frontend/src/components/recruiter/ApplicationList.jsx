import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import axios from "@/utils/axios"; // your axios instance with auth token

const ApplicationList = ({ jobId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null); // track which app is being updated

  useEffect(() => {
    if (!jobId) return;
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/recruiter/jobs/${jobId}/applications/`);
        setApplications(res.data);
      } catch (err) {
        setError("Failed to load applications");
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [jobId]);

  const updateStatus = async (applicationId, status) => {
    try {
      setUpdating(applicationId);
      const res = await axios.patch(`/recruiter/applications/${applicationId}/`, {
        status,
      });
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: res.data.status } : app
        )
      );
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) return <p className="text-red-500">{error}</p>;

  if (applications.length === 0) {
    return <p className="text-gray-500 p-4">No applications yet.</p>;
  }

  return (
    <Card className="shadow-md rounded-2xl">
      <CardContent>
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Applicant</th>
              <th className="p-3">Email</th>
              <th className="p-3">Resume</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{app.student_name}</td>
                <td className="p-3">{app.student_email}</td>
                <td className="p-3">
                  <a
                    href={app.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Resume
                  </a>
                </td>
                <td className="p-3 capitalize">{app.status}</td>
                <td className="p-3 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updating === app.id}
                    onClick={() => updateStatus(app.id, "shortlisted")}
                  >
                    Shortlist
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={updating === app.id}
                    onClick={() => updateStatus(app.id, "rejected")}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={updating === app.id}
                    onClick={() => updateStatus(app.id, "hired")}
                  >
                    Hire
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default ApplicationList;
