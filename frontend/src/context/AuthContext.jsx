import { createContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

export const AuthContext = createContext(null); 

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    const initAuth = async()=>{
      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        setLoading(false);
        return;
      }

      try {
        const res = await axiosInstance.post("/users/token/refresh/",{
          refresh,
        })
        localStorage.setItem("access",res.data.access);
        if (res.data.refresh) {
          localStorage.setItem("refresh", res.data.refresh);
        }
        setUser(jwtDecode(res.data.access));
      } catch {
        localStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  },[]);

  const loginUser = (access, refresh) => {
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      const decoded = jwtDecode(access);
      setUser(decoded);

      if (decoded.role === "admin") {
        navigate("/admin/dashboard");
      } else if (decoded.role === "Instructor") {
        navigate("/tutor/dashboard");
      } else {
        navigate("/");
      }
    } 

  const logoutUser = async () => {
    try {
      await axiosInstance.post("/users/logout/", {
        refresh: localStorage.getItem("refresh"),
      });
    } catch {}
    localStorage.clear();
    setUser(null);
    navigate("/login");
  };

  if (loading) return null;
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loginUser,
        logoutUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 
