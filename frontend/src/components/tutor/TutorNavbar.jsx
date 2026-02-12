import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { MessageCircle } from "lucide-react";
import useChatNotifySocket from "../../hooks/useChatNotifySocket";

const TutorNavbar = ({ title }) => {
  const {user,logoutUser} = useContext(AuthContext)
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const [openDropdown, setOpenDropdown] = useState(false);

  const userId = user?.id || null;
  const { unreadChats } = useChatNotifySocket(userId);

  const unreadCount = Object.keys(unreadChats).length;


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-50">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <p className="text-lg text-gray-500">Tutor control panel</p>
      </div>

      <div className="flex items-center space-x-16">
        <div className="relative hidden md:flex items-center space-x-4" ref={dropdownRef}>
          <div className="relative cursor-pointer"
              onClick={() => navigate("/tutor/chat")}
          >
            <MessageCircle className="w-6 h-6 text-gray-600 hover:text-blue-600" />

            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          {user?.username && (
            <>
              <div
                className="cursor-pointer w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center font-extrabold"
                onClick={() => setOpenDropdown(!openDropdown)}
                title={user.username}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>

              {openDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 z-50">
                  <div className="px-4 py-2 text-gray-700 font-medium">
                    {user.username} - {user.role}
                  </div>
                  <button
                    onClick={logoutUser}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TutorNavbar;