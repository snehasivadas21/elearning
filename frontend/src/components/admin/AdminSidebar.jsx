import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap, BarChart2 , Layers, Boxes, Wallet } from "lucide-react";

const navLinks = [
  { name: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/admin/dashboard" },
  { name: "Students", icon: <Users size={18} />, path: "/admin/students" },
  { name: "Instructors", icon: <GraduationCap size={18} />, path: "/admin/instructors" },
  { name: "Courses", icon: <Layers size={18} />, path: "/admin/courses" },
  { name: "Categories", icon: <Boxes size={18} />, path: "/admin/categories" },
  { name: "Orders", icon: <Wallet size={18} />, path: "/admin/orders" },
  
  // { name: "Statistics", icon: <BarChart2 size={18} />, path: "/admin/stats" },
];

const AdminSidebar = () => {
  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col py-6 shadow-xl">
      <div className="text-center font-bold text-3xl bg-gradient-to-r from-blue-600 to-purple-600 tracking-wide mb-8 bg-clip-text text-transparent">
        PyTech<span className="text-gray-400 text-2xl"> Admin</span>
      </div>

      <nav className="flex flex-col space-y-2 px-4">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-lg hover:bg-slate-700 transition ${
                isActive ? "bg-slate-700" : ""
              }`
            }
          >
            <span className="mr-3">{link.icon}</span>
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;