import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) return null; // Prevent redirect before auth check

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;