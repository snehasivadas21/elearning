import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  User,
  Wallet,
  MessageCircle,
  VideoIcon,
  ShoppingCart,
  Menu,
  X,
} from "lucide-react";

const navLinks = [
  { name: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/tutor/dashboard" },
  { name: "Courses", icon: <Layers size={18} />, path: "/tutor/courses" },
  { name: "My Profile", icon: <User size={18} />, path: "/tutor/profile" },
  { name: "Community", icon: <MessageCircle size={18} />, path: "/tutor/chat" },
  { name: "Live", icon: <VideoIcon size={18} />, path: "/tutor/live" },
  { name: "Orders", icon: <ShoppingCart size={18} />, path: "/tutor/orders" },
  { name: "Wallet", icon: <Wallet size={18} />, path: "/tutor/wallet" },
];

const TutorSidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white">
        <h1 className="font-bold text-xl">PyTech</h1>
        <button onClick={() => setOpen(true)}>
          <Menu size={26} />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 z-50 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col py-6 shadow-xl transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Close button mobile */}
        <div className="md:hidden flex justify-end px-4">
          <button onClick={() => setOpen(false)}>
            <X size={24} />
          </button>
        </div>

        {/* Logo */}
        <div className="text-center font-bold text-3xl bg-gradient-to-r from-blue-600 to-purple-600 tracking-wide mb-8 bg-clip-text text-transparent">
          PyTech <span className="text-gray-400 text-2xl">Tutor</span>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col space-y-2 px-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setOpen(false)}
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
    </>
  );
};

export default TutorSidebar;