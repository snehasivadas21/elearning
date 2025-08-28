import React, { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";

const InstructorLiveSessionPanel = ({ course }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  
  const createSession = async () => {
    if (!course || !course.id) {
      console.error("Course is not available or missing ID");
      alert("Error: Course information is not available");
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.post("/livesession/", {
        course: course.id, 
      });
      setSession(res.data);
      console.log("Session created:", res.data);
    } catch (err) {
      console.error("Error creating session", err);
      alert("Failed to create session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  
  const startSession = async () => {
    if (!session) {
      alert("No session available to start");
      return;
    }
    try {
      setLoading(true);
      await axiosInstance.post(`/livesession/${session.id}/start/`);
      alert(" Session started! Share link with students.");
      navigate(`/live-session/${session.id}`)
    } catch (err) {
      console.error("Error starting session", err);
      alert("Failed to start session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  
  const endSession = async () => {
    if (!session) {
      alert("No session available to end");
      return;
    }
    try {
      setLoading(true);
      await axiosInstance.post(`/livesession/${session.id}/end/`);
      alert("Session ended!");
      setSession(null); 
    } catch (err) {
      console.error("Error ending session", err);
      alert("Failed to end session. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  const Button = ({ children, onClick, disabled, variant }) => {
    const base =
      "px-4 py-2 rounded-md font-medium text-sm transition-colors";
    const styles = {
      default:
        "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400",
    };
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${styles[variant || "default"]}`}
      >
        {children}
      </button>
    );
  };

  if (!course) {
    return (
      <div className="p-4 border rounded-lg shadow-sm bg-white">
        <h2 className="text-lg font-semibold mb-3">Live Session Management</h2>
        <p className="text-gray-500">Loading course information...</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-3">Live Session Management</h2>
      {!session ? (
        <Button onClick={createSession} disabled={loading}>
          {loading ? "Creating..." : "Create Live Session"}
        </Button>
      ) : (
        <div className="space-x-2">
          <p className="text-sm text-green-600 mb-2">
            Session created! ID: {session.id}
          </p>
          <Button onClick={startSession} disabled={loading}>
            {loading ? "Starting..." : "Start Session"}
          </Button>
          <Button variant="destructive" onClick={endSession} disabled={loading}>
            {loading ? "Ending..." : "End Session"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default InstructorLiveSessionPanel;