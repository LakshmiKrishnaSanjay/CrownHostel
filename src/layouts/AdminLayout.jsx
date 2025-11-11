import { Outlet, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/"); // redirect to signin page
  };

  return (
    <div className="flex">
      <Sidebar onLogout={handleLogout} /> {/* pass logout function to sidebar */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onLogout={handleLogout} /> {/* optional: header logout */}
        <main className="flex-grow p-6 bg-gray-50">
          <Outlet /> {/* nested admin pages render here */}
        </main>
        <Footer />
      </div>
    </div>
  );
}
