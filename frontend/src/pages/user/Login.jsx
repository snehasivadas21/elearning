import { useContext, useState } from 'react';
import axiosPublic from "../../api/axiosPublic";
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  
  const {loginUser} = useContext(AuthContext)

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosPublic.post("/users/token/", form);
      const { access, refresh } = res.data;

      loginUser(access,refresh);

    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        alert("Invalid email or password.");
      } else if (err.response?.status === 500) {
        alert("Server error. Please try again later.");
      } else {
        alert("Something went wrong.");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-xl p-8 bg-white rounded-2xl shadow-md">
        <div className="block md:block">
          <img
            src="/AdobeStock_416743421_Preview.jpeg"
            alt="Login Visual"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-center text-sm text-gray-500 mb-6">Login to continue</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
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
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Or login with</p>
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
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;