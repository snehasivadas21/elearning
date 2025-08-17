import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentMockInterviewsDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await axiosInstance.get("/student/mock-interviews/");
        const data = res.data;

        setInterviews(data);

        // Filter upcoming interviews for toast notifications
        const upcomingInterviews = data.filter(iv => {
          const interviewTime = new Date(iv.scheduled_at).getTime();
          return iv.status === "scheduled" && interviewTime > Date.now();
        });
        setUpcoming(upcomingInterviews);
      } catch (err) {
        console.error(err);
      }
    };

    fetchInterviews();

    // Refresh every 5 minutes
    const interval = setInterval(fetchInterviews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const upcomingList = interviews.filter(iv => iv.status === "scheduled");
  const completedList = interviews.filter(iv => iv.status === "completed");

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold mb-4">My Mock Interviews</h2>

      {/* Toast Reminders */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {upcoming.map(iv => (
          <div
            key={iv.id}
            className="bg-blue-600 text-white p-3 rounded-lg shadow-md"
          >
            📢 Upcoming Interview: <b>{iv.course.title}</b> <br />
            Instructor: {iv.instructor?.email || "TBA"} <br />
            Time: {new Date(iv.scheduled_at).toLocaleTimeString()} <br />
            {iv.meet_link && (
              <a
                href={iv.meet_link}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Join Link
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Upcoming Interviews */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Upcoming Interviews</h3>
        {upcomingList.length === 0 ? (
          <p className="text-gray-500">No upcoming interviews.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingList.map(iv => (
              <Card key={iv.id}>
                <CardContent className="p-4 space-y-2">
                  <p className="font-medium">{iv.course.title}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(iv.scheduled_at).toLocaleString()}
                  </p>
                  <p>Instructor: {iv.instructor?.email || "TBA"}</p>
                  {iv.meet_link && (
                    <Button as="a" href={iv.meet_link} target="_blank">
                      Join Interview
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Interviews */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Completed Interviews</h3>
        {completedList.length === 0 ? (
          <p className="text-gray-500">No completed interviews yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedList.map(iv => (
              <Card key={iv.id} className="bg-gray-50">
                <CardContent className="p-4 space-y-2">
                  <p className="font-medium">{iv.course.title}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(iv.scheduled_at).toLocaleString()}
                  </p>
                  <p>Instructor: {iv.instructor?.email || "TBA"}</p>
                  {iv.feedback && (
                    <p>
                      <span className="font-semibold">Feedback:</span> {iv.feedback}
                    </p>
                  )}
                  {iv.score !== null && <p>Score: {iv.score}/100</p>}
                  {iv.rating !== null && <p>Rating: {"⭐".repeat(iv.rating)}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
