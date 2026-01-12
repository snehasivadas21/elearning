import { useContext, useState } from 'react';
import axiosPublic from "../../api/axiosPublic";
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import GoogleLoginButton from '../../components/user/GoogleLoginButton';
import {Eye,EyeOff} from "lucide-react"

const Login = () => {

  const {loginUser} = useContext(AuthContext)
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  
  const [error,setError] = useState("")
  const [loading,setLoading] = useState(false)
  const [showPassword,setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axiosPublic.post("/users/token/", form);
      const { access, refresh } = res.data;

      loginUser(access,refresh);

    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data;

      if (status === 401 && detail === "ACCOUNT_DEACTIVATED") {
        setError("Your account has been deactivated. Please contact support.");
      } 
      else if (status === 401) {
        setError("Invalid email or password.");
      } 
      else {
        setError("Something went wrong. Please try again.");
      }
    }finally {
      setLoading(false);
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

        {error && (
          <p className='mb-4 text-sm text-red-600 text-center'>
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md pr-10"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        <div className='flex justify-between text-sm mt-4'>
          <Link
            to="/forget-password"
            className='text-blue-600 hover:underline'>
            Forget Password
          </Link>

        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Or Continue with</p>
            <GoogleLoginButton/>
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