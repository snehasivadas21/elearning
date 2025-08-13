import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);

  if (loading) return null; // or spinner

  return isAuthenticated && user?.role === "admin"
    ? children
    : <Navigate to="/login" replace />;
};

export default AdminRoute;