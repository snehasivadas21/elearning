import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import axios from "axios";

export default function InstructorMockInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    const res = await axios.get("/api/instructor/interviews/"); // your DRF endpoint
    setInterviews(res.data);
  };

  const updateStatus = async (id, status) => {
    await axios.patch(`/api/instructor/interviews/${id}/`, { status });
    fetchInterviews();
  };

  const sendReminder = async (id) => {
    await axios.post(`/api/instructor/interviews/${id}/send-reminder/`);
    alert("Reminder sent!");
  };

  const saveFeedback = async () => {
    if (!selected) return;
    await axios.patch(`/api/instructor/interviews/${selected.id}/`, {
      feedback: selected.feedback,
      score: selected.score,
      rating: selected.rating,
    });
    setSelected(null);
    fetchInterviews();
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Mock Interviews</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {interviews.map((interview) => (
          <Card key={interview.id} className="shadow-md">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold">{interview.student_name}</h3>
              <p className="text-sm text-gray-600">{interview.course_title}</p>
              <p className="text-sm">📅 {new Date(interview.scheduled_at).toLocaleString()}</p>
              <p className="text-sm">🔗 <a href={interview.meet_link} className="text-blue-600 underline">Meet Link</a></p>
              <p className="text-sm">Status: {interview.status}</p>

              <div className="flex gap-2 mt-2">
                <Select onValueChange={(value) => updateStatus(interview.id, value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => sendReminder(interview.id)}>Send Reminder</Button>
                <Button onClick={() => setSelected(interview)}>Add Feedback</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feedback Modal */}
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-[400px] space-y-3">
            <h3 className="text-lg font-semibold">Feedback for {selected.student_name}</h3>
            <Textarea
              placeholder="Write feedback..."
              value={selected.feedback || ""}
              onChange={(e) => setSelected({ ...selected, feedback: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Score"
              value={selected.score || ""}
              onChange={(e) => setSelected({ ...selected, score: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Rating (1-5)"
              value={selected.rating || ""}
              onChange={(e) => setSelected({ ...selected, rating: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              <Button onClick={saveFeedback}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
