import { GoogleLogin } from "@react-oauth/google";
import axiosPublic from "../../api/axiosPublic";

const GoogleLoginButton = () => {
  const handleSuccess = async (credentialResponse) => {
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
      console.error("Google login failed:", err.response?.data);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.log("Google Login Failed")}
      theme="outline"
      size="large"
      width="100%"
    />
  );
};

export default GoogleLoginButton;
