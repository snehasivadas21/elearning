import { useContext, useState } from 'react';
import axiosPublic from "../../api/axiosPublic";
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Login = () => {

  const {loginUser} = useContext(AuthContext)
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  
  const [error,setError] = useState("")
  const [loading,setLoading] = useState(false)

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
      const data = err.response?.data;

      if (status === 403 && data?.error === "email_not_verified"){
        setError("Please verify your email before logging in.");
      }else if (status === 401){
        setError("Invalid email or password");
      }else{
        setError("Something went wrong.Please try again")
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

          <Link
            to="/resend-verification"
            className='text-blue-600 hover:underline'>
            Resend Verification
          </Link>

        </div>

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