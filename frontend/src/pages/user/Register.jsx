import { useState } from 'react';
import axiosPublic from "../../api/axiosPublic";
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmpassword: '',
    role: 'student',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmpassword){
      alert("Password do not match");
      return;
    }

    try {
      const payload = {
        email : form.email,
        username : form.username,
        password : form.password,
        role : form.role,
      }
      await axiosPublic.post("/users/register/",payload)
      navigate("/check-email/")
    } catch (error) {
      console.error(error.response?.data);
      alert("Registration failed.Try again")
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-xl p-10 bg-white rounded-2xl shadow-md">
        <div className="block md:block">
          <img
            src="/AdobeStock_416743421_Preview.jpeg"
            alt="Login Visual"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Create your account</h2>
        <p className="text-center text-sm text-gray-500 mb-6">Join us and start learning today</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmpassword}
            onChange={(e) => setForm({ ...form, confirmpassword: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="recruiter">Recruiter</option>
          </select>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
          >
            Register
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Or continue with</p>
          <button
            onClick={() =>
              window.location.href =
                "http://localhost:8000/auth/o/google-oauth2/?redirect_uri=http://localhost:5173/google/callback"
            }
            className="w-full border border-gray-300 p-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-100"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;