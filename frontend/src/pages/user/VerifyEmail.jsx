import { useEffect, useState } from "react"
import { useParams,useNavigate } from "react-router-dom"
import axiosPublic from "../../api/axiosPublic"

const VerifyEmail = () => {
    const {uid,token} = useParams();
    const navigate = useNavigate();
    const [status,setStatus] = useState("verifying");

    useEffect(()=>{
        const verify = async()=>{
            try {
                await axiosPublic.post("/users/verify-email/",{
                    uidb64:uid,
                    token,
                })
                setStatus("success")
                setTimeout(() => navigate("/login/"),2000);
                
            } catch {
                setStatus("error")
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
            {status === "error" && (
                <p className="text-red-600 font-semibold">
                    Verification failed or link expired
                </p>
            )}

        </div>

    </div>
  )
}

export default VerifyEmail