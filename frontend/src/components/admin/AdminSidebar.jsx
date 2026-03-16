import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap, Layers, Boxes, Wallet, ShoppingCart, DollarSign, Menu, X } from "lucide-react";

const navLinks = [
  { name: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/admin/dashboard" },
  { name: "Students", icon: <Users size={18} />, path: "/admin/students" },
  { name: "Instructors", icon: <GraduationCap size={18} />, path: "/admin/instructors" },
  { name: "Courses", icon: <Layers size={18} />, path: "/admin/courses" },
  { name: "Categories", icon: <Boxes size={18} />, path: "/admin/categories" },
  { name: "Orders", icon: <ShoppingCart size={18} />, path: "/admin/orders" },
  { name: "Payouts", icon: <Wallet size={18} />, path: "/admin/payouts" },
  { name: "Revenue", icon: <DollarSign size={18} />, path: "/admin/revenue" },
];

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const SidebarContent = () => (
    <aside className="w-64 h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col py-6 shadow-xl">
      <div className="text-center font-bold text-3xl bg-gradient-to-r from-blue-600 to-purple-600 tracking-wide mb-8 bg-clip-text text-transparent">
        PyTech<span className="text-gray-400 text-2xl"> Admin</span>
      </div>
      <nav className="flex flex-col space-y-2 px-4">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={() => setIsOpen(false)}
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

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-800 text-white p-2 rounded-lg shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`md:hidden fixed top-0 left-0 h-full z-40 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </div>

      <div className="hidden md:block h-screen sticky top-0">
        <SidebarContent />
      </div>
    </>
  );
};

export default AdminSidebar;