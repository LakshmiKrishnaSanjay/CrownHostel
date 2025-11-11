import React from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

     console.log("Token after logout:", localStorage.getItem("token")); // ✅ should show null

    alert("Logged out successfully!");
    navigate("/");
  };

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side */}
        <h1 className="text-xl font-semibold text-gray-700">Admin Dashboard</h1>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">Welcome, Admin</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
