import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";

const getTitleFromPath = (path) => {
  if (path.includes("students")) return "Students Management";
  if (path.includes("instructors")) return "Instructor Management";
  if (path.includes("courses")) return "Course Management";
  if (path.includes("categories")) return "Category Management"
  if (path.includes("stats")) return "Platform Analytics";
  return "Dashboard Overview";
};

const AdminLayout = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 flex flex-col">
        <AdminNavbar title={getTitleFromPath(location.pathname)} />
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;