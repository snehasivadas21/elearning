import { GoogleLogin } from "@react-oauth/google";
import axiosPublic from "../../api/axiosPublic";
import { useState } from "react";

const GoogleLoginButton = () => {
  const [error,setError] = useState("");

  const handleSuccess = async (credentialResponse) => {
    setError("");
    try {
      const res = await axiosPublic.post("/users/google/", {
        credential: credentialResponse.credential, 
      });

      const { access, refresh, role } = res.data;

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      window.location.href =
        role === "instructor"
          ? "/tutor/dashboard"
          : "/student/dashboard";
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.blocked) {
        const errorMsg = err.response.data.error || "Your account has been suspended.";
        setError(errorMsg);
        alert(errorMsg); 
      } else {
        console.error("Google login failed:", err.response?.data);
        setError("Login failed. Please try again.");
      }
    }
  };

  return (
    <div>
      {error && (
        <p className="mb-3 text-sm text-red-600 text-center">
          {error}
        </p>
      )}
      
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          setError("Google Login Failed");
          console.log("Google Login Failed");
        }}
        theme="outline"
        size="large"
        width="100%"
      />
    </div>
  );
};

export default GoogleLoginButton;
