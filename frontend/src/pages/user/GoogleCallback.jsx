import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from "../../api/axiosInstance";


const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      axiosInstance.
        post("http://localhost:8000/auth/o/google-oauth2/", {
          code: code,
          redirect_uri: "http://localhost:5173/google/callback",
        })
        .then((res) => {
          localStorage.setItem("access", res.data.access_token);
          localStorage.setItem("refresh", res.data.refresh_token);
          navigate("/dashboard");
        })
        .catch((err) => {
          console.error("Google login error:", err);
          alert("Google login failed");
        });
    }
  }, []);

  return <p className="text-center mt-10">🔄 Logging in with Google...</p>;
};

export default GoogleCallback;