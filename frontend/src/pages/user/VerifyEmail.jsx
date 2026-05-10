import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axiosPublic from "../../api/axiosPublic"

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [status,setStatus] = useState("verifying");

    const query = new URLSearchParams(window.location.search)
    const uid = query.get("uid");
    const token = query.get("token")

    useEffect(()=>{
        const verify = async()=>{
            try {
                await axiosPublic.get(
                    `/users/verify-email/?uid=${uid}&token=${token}`
                )
                setStatus("success")
                setTimeout(() => navigate("/login/"),2000);
                
            } catch (err) {
                setStatus(
                    err.response?.data?.error || 
                    "Verification failed"
                );
            }
        }
        verify();
    },[uid,token,navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
            {status === "verifying" && <p>Verifying your email...</p>}
            {status === "success" && (
                <p className="text-green-600 font-semibold">
                    Email verified successfully
                    Redirecting to login...

                </p>
            )}
            {typeof status === "string" &&
            status !== "verifying" &&
            status !== "success" && (
                <p className="text-red-600 font-semibold">
                   {status}
                </p>
            )}

        </div>

    </div>
  )
}

export default VerifyEmail