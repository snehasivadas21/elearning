import { useState } from 'react';
import axiosPublic from "../../api/axiosPublic";
import { useNavigate, Link } from 'react-router-dom';
import GoogleLoginButton from '../../components/user/GoogleLoginButton';
import { toast } from "react-toastify";

const Register = () => {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirm_password: '',
    role: 'student',
  });

  const passwordRules = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    lowercase: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*]/.test(form.password),
  };
  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setTouched({
      email: true,
      username: true,
      password: true,
      confirm_password: true,
    });

    if (!isPasswordValid) return;

    if (form.password !== form.confirm_password) {
      setErrors({ confirm_password: "Passwords do not match" });
      return;
    }

    try {
      setLoading(true);

      await axiosPublic.post("/users/register/",form);

      toast.success("Check your email to verify account");
      navigate("/check-email/")
    } catch (error) {
      const data = error.response?.data;

      if (data) {
        setErrors(data);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
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
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              setErrors({ ...errors, email: null }); // clear error while typing
            }}
            onBlur={() => setTouched({ ...touched, email: true })}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          {touched.email && errors.email && (
            <p className="text-red-500 text-xs">{errors.email[0]}</p>
          )}

          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => {
              setForm({ ...form, username: e.target.value });
              setErrors({ ...errors, username: null });
            }}
            onBlur={() => setTouched({ ...touched, username: true })}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          {touched.username && errors.username && (
            <p className="text-red-500 text-xs">{errors.username[0]}</p>
          )}

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onFocus={() => setShowRules(true)}
            onBlur={() => {
              if (form.password === "") setShowRules(false);
            }}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          {showRules && !isPasswordValid && (
            <div className="text-xs space-y-1 mt-1">
              <p className={passwordRules.length ? "text-green-600" : "text-gray-500"}>
                ✔ At least 8 characters
              </p>
              <p className={passwordRules.uppercase ? "text-green-600" : "text-gray-500"}>
                ✔ One uppercase letter
              </p>
              <p className={passwordRules.lowercase ? "text-green-600" : "text-gray-500"}>
                ✔ One lowercase letter
              </p>
              <p className={passwordRules.number ? "text-green-600" : "text-gray-500"}>
                ✔ One number
              </p>
              <p className={passwordRules.special ? "text-green-600" : "text-gray-500"}>
                ✔ One special character
              </p>
            </div>
          )}

          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirm_password}
            onChange={(e) => {
              setForm({ ...form, confirm_password: e.target.value });
              setErrors({ ...errors, confirm_password: null });
            }}
            onBlur={() => setTouched({ ...touched, confirm_password: true })}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          {touched.confirm_password && errors.confirm_password && (
            <p className="text-red-500 text-xs">{errors.confirm_password}</p>
          )}

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className={`w-full p-2 rounded-md text-white transition ${
              loading 
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className='flex-1 h-px bg-gray-200'></div>
            <p className="text-sm text-gray-500">Or Continue with</p>
            <div className='flex-1 h-px bg-gray-200'></div>
          </div>
          
          <div className='flex justify-center'>
            <GoogleLoginButton/>
          </div>  
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