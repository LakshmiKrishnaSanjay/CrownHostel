import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp, verifyOtp } from "../../services/authService";

export default function Signin() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [role, setRole] = useState(null);
  const [normalizedPhone, setNormalizedPhone] = useState(null);
  const navigate = useNavigate();

  // ✅ Step 1: Send OTP
  const handleSendOtp = async () => {
    try {
      const { confirmation, role, phone: phoneWithCode } = await sendOtp(phone);
      setConfirmation(confirmation);
      setRole(role);
      setNormalizedPhone(phoneWithCode);
      alert("OTP sent!");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // ✅ Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    try {
      const user = await verifyOtp(confirmation, otp, role, normalizedPhone);

      // ✅ Save login info in localStorage
      localStorage.setItem("token", user.uid);
      localStorage.setItem("role", user.role);

      alert("Login successful!");
      console.log("Logged in role:", user.role);

      // ✅ Navigate based on role
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/payment");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Invalid OTP");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-xl p-8 w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login with OTP</h2>

        {!confirmation ? (
          <div className="space-y-4">
            <input
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div id="recaptcha-container"></div>
            <button
              onClick={handleSendOtp}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Send OTP
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleVerifyOtp}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Verify OTP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
