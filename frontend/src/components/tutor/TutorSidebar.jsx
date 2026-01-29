import { NavLink } from "react-router-dom";
import { LayoutDashboard, Layers, User, Wallet, MessageCircle, VideoIcon } from "lucide-react";

const navLinks = [
  { name: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/tutor/dashboard" },
  { name: "Courses", icon: <Layers size={18} />, path: "/tutor/courses" },
  { name: "My Profile", icon: <User size={18} />, path: "/tutor/profile" },
  { name: "Community", icon: <MessageCircle size={18} />, path: "/tutor/chat" },
  { name: "Orders", icon: <Wallet size={18} />, path: "/tutor/orders" },
  { name: "Live", icon: <VideoIcon size={18} />, path: "/tutor/orders" },
];

const TutorSidebar = () => {
  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col py-6 shadow-xl">
      <div className="text-center font-bold text-3xl bg-gradient-to-r from-blue-600 to-purple-600 tracking-wide mb-8 bg-clip-text text-transparent">
        PyTech<span className="text-gray-400 text-2xl"> Tutor</span>
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

export default TutorSidebar;