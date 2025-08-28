import { useState } from 'react';
import axiosPublic from "../../api/axiosPublic";
import { useNavigate } from 'react-router-dom';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', otp: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosPublic.post("/users/verify-otp/", form);
      // alert(" Email verified! You can now log in.");
      navigate("/login");
    } catch (err) {
      // alert(" Verification failed");
      console.error(err.response?.data);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Verify Your Email</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-2 border rounded-md"
          />
          <input
            type="text"
            placeholder="Enter OTP"
            value={form.otp}
            onChange={(e) => setForm({ ...form, otp: e.target.value })}
            className="w-full p-2 border rounded-md"
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white p-2 rounded-md hover:bg-green-700"
          >
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;