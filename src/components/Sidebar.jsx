import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  Bed,
  CreditCard,
  BarChart2,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Sidebar() {
  const [openMenu, setOpenMenu] = useState("");

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? "" : menu);
  };

  return (
    <div className="w-64 bg-indigo-700 text-white min-h-screen flex flex-col">
      {/* Logo / Title */}
      <div className="p-5 text-center font-bold text-xl border-b border-indigo-600">
        Crown Hostel
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {/* Dashboard */}
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
              isActive
                ? "bg-indigo-500 text-white"
                : "hover:bg-indigo-600 text-gray-200"
            }`
          }
        >
          <Home size={20} />
          <span>Dashboard</span>
        </NavLink>

        {/* Rooms Dropdown */}
        <div>
          <button
            onClick={() => toggleMenu("rooms")}
            className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-indigo-600 transition-all"
          >
            <div className="flex items-center gap-3">
              <Bed size={20} />
              <span>Rooms</span>
            </div>
            {openMenu === "rooms" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {openMenu === "rooms" && (
            <div className="ml-10 mt-1 space-y-1">
              <NavLink
                to="/admin/addroom"
                className={({ isActive }) =>
                  `block px-3 py-1 rounded-md text-sm ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "hover:bg-indigo-600 text-gray-200"
                  }`
                }
              >
                Add Room
              </NavLink>
              <NavLink
                to="/admin/viewroom"
                className={({ isActive }) =>
                  `block px-3 py-1 rounded-md text-sm ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "hover:bg-indigo-600 text-gray-200"
                  }`
                }
              >
                View Rooms
              </NavLink>
            </div>
          )}
        </div>

        {/* Hostlers Dropdown */}
        <div>
          <button
            onClick={() => toggleMenu("hostlers")}
            className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-indigo-600 transition-all"
          >
            <div className="flex items-center gap-3">
              <Users size={20} />
              <span>Hostlers</span>
            </div>
            {openMenu === "hostlers" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {openMenu === "hostlers" && (
            <div className="ml-10 mt-1 space-y-1">
              <NavLink
                to="/admin/registerhostlers"
                className={({ isActive }) =>
                  `block px-3 py-1 rounded-md text-sm ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "hover:bg-indigo-600 text-gray-200"
                  }`
                }
              >
                Add Hostler
              </NavLink>
              <NavLink
                to="/admin/viewhostlers"
                className={({ isActive }) =>
                  `block px-3 py-1 rounded-md text-sm ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "hover:bg-indigo-600 text-gray-200"
                  }`
                }
              >
                View Hostlers
              </NavLink>
            </div>
          )}
        </div>

        {/* Payments Dropdown */}
        <div>
          <button
            onClick={() => toggleMenu("payments")}
            className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-indigo-600 transition-all"
          >
            <div className="flex items-center gap-3">
              <CreditCard size={20} />
              <span>Payments</span>
            </div>
            {openMenu === "payments" ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>

          {openMenu === "payments" && (
            <div className="ml-10 mt-1 space-y-1">
              <NavLink
                to="/admin/pendingpayments"
                className={({ isActive }) =>
                  `block px-3 py-1 rounded-md text-sm ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "hover:bg-indigo-600 text-gray-200"
                  }`
                }
              >
                Pending Payments
              </NavLink>
              <NavLink
                 to="/admin/paymentlist"
                className={({ isActive }) =>
                  `block px-3 py-1 rounded-md text-sm ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "hover:bg-indigo-600 text-gray-200"
                  }`
                }
              >
                View Screenshots
              </NavLink>
            </div>
          )}
        </div>

        {/* Reports */}
        <NavLink
          to="/admin/reports"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
              isActive
                ? "bg-indigo-500 text-white"
                : "hover:bg-indigo-600 text-gray-200"
            }`
          }
        >
          <BarChart2 size={20} />
          <span>Reports</span>
        </NavLink>
      </nav>


    </div>
  );
}
