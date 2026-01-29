import { useState } from "react";
import axiosPrivate from "../../../api/axiosPrivate";

const InstructorLiveCreatePage = () => {
  const [form, setForm] = useState({
    title: "",
    course: "",
    scheduled_at: "",
  });

  const submit = async () => {
    await axiosPrivate.post("/live/", form);
    alert("Live session created");
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Create Live Session</h1>

      <input
        placeholder="Title"
        className="input mb-3"
        onChange={e => setForm({ ...form, title: e.target.value })}
      />

      <input
        type="datetime-local"
        className="input mb-3"
        onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
      />

      <button
        onClick={submit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create
      </button>
    </div>
  );
};

export default InstructorLiveCreatePage;
