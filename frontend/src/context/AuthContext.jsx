import { createContext, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(); 

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const getUserFromToken = () => {
    const token = localStorage.getItem("access");
    return token ? jwtDecode( token ) : null;
  };

  const [user, setUser] = useState(getUserFromToken);

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

  const logoutUser = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login");
  };
  
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
