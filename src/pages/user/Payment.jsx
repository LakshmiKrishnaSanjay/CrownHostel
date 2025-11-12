import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadPayment } from "../../services/paymentService";

export default function Payment() {
  const [showPayment, setShowPayment] = useState(false);
  const [numPayments, setNumPayments] = useState(1);
  const [hostler, setHostler] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDue, setIsDue] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("hostlerData");
    if (data) {
      const parsed = JSON.parse(data);
      setHostler(parsed);

      // ✅ Check if payment is due
      if (parsed.nextPaymentDate) {
        const nextDate = new Date(
          parsed.nextPaymentDate.seconds
            ? parsed.nextPaymentDate.seconds * 1000
            : parsed.nextPaymentDate
        );
        const today = new Date();
        setIsDue(today > nextDate);
      }
    }
  }, []);

  if (!hostler) return <p className="text-center mt-10">Loading...</p>;

  const amount = numPayments * Number(hostler.price);

  const dueDate = hostler.nextPaymentDate
    ? new Date(
        hostler.nextPaymentDate.seconds
          ? hostler.nextPaymentDate.seconds * 1000
          : hostler.nextPaymentDate
      ).toLocaleDateString()
    : "N/A";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScreenshot(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!screenshot) return alert("Please upload a payment screenshot.");

    setLoading(true);
    const paymentDate = new Date().toISOString();
    const res = await uploadPayment(
      hostler.id,
      hostler.name,
      amount,
      numPayments,
      screenshot,
      paymentDate
    );
    setLoading(false);

    if (res.success) {
      alert("✅ Payment uploaded successfully! Awaiting admin approval.");
      setShowPayment(false);
      setScreenshot(null);
    } else {
      alert("❌ Error uploading payment. Please try again.");
    }
  };

  // ✅ If no payment due
  if (!isDue) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 text-center p-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">
          No Due Left 🎉
        </h2>
        <p className="text-gray-600">
          Your next payment is not yet due. <br />
          <span className="font-medium">
            Next Payment Date: {dueDate}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      <div
        className={`bg-white rounded-xl shadow-md p-6 transition-all duration-300 w-full ${
          showPayment ? "max-w-5xl" : "max-w-md"
        }`}
      >
        <h2 className="text-2xl font-semibold text-center mb-6">
          {hostler.name} Payment Form
        </h2>

        <form onSubmit={handleSubmit}>
          <div
            className={`grid gap-8 ${
              showPayment ? "md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* LEFT SIDE FORM */}
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={hostler.name}
                  disabled
                  className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100"
                />
              </div>

<div>
  <label className="block font-medium mb-1">Due Date</label>
  <input
    type="text"
    value={dueDate ? formatDate(dueDate) : ""}
    disabled
    className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100"
  />
</div>




              <div>
                <label className="block font-medium mb-1">Amount Per Month</label>
                <input
                  type="text"
                  value={`₹${amount}`}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100"
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowPayment(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
                >
                  Pay Now
                </button>
              </div>
            </div>

            {/* RIGHT SIDE - QR & UPLOAD */}
            <AnimatePresence>
              {showPayment && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-start border-l border-gray-200 pl-6"
                >
                  <p className="font-medium mb-3 text-lg text-gray-700">
                    Scan to Pay
                  </p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=upi://pay?pa=example@upi&amount=${amount}&size=150x150`}
                    alt="QR Code"
                    className="w-44 h-44 border rounded-lg shadow-sm"
                  />

                  <div className="mt-6 w-full">
                    <label className="block font-medium mb-2">
                      Upload Payment Screenshot
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full border border-gray-300 rounded-lg p-2"
                      onChange={handleFileChange}
                    />

                    {screenshot && (
                      <img
                        src={screenshot}
                        alt="Preview"
                        className="mt-3 w-40 h-40 rounded-lg object-cover border"
                      />
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition w-full"
                    >
                      {loading ? "Uploading..." : "Submit Payment"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </div>
  );
}
