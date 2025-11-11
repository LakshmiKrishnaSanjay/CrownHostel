import { useState } from "react";

export default function AdminPayments() {
  const [payments, setPayments] = useState([
    {
      id: 1,
      name: "Lakshmi",
      room: "A-102",
      amount: "₹3,000",
      date: "2025-11-04",
      screenshot:
        "https://via.placeholder.com/150", // dummy uploaded proof
      status: "Pending",
    },
    {
      id: 2,
      name: "Meera",
      room: "B-204",
      amount: "₹3,000",
      date: "2025-11-04",
      screenshot:
        "https://via.placeholder.com/150",
      status: "Approved",
    },
  ]);

  const updateStatus = (id, newStatus) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-semibold text-center mb-8">
        Crown Hostel – Admin Payment Dashboard
      </h1>

      <div className="overflow-x-auto bg-white shadow-lg rounded-2xl p-6">
        <table className="min-w-full border">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Room</th>
              <th className="p-3 border">Amount</th>
              <th className="p-3 border">Date</th>
              <th className="p-3 border">Screenshot</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="text-center border-b">
                <td className="p-3 border">{p.name}</td>
                <td className="p-3 border">{p.room}</td>
                <td className="p-3 border">{p.amount}</td>
                <td className="p-3 border">{p.date}</td>
                <td className="p-3 border">
                  <img
                    src={p.screenshot}
                    alt="Proof"
                    className="w-16 h-16 object-cover rounded-lg mx-auto cursor-pointer"
                    onClick={() => window.open(p.screenshot, "_blank")}
                  />
                </td>
                <td
                  className={`p-3 border font-medium ${
                    p.status === "Approved"
                      ? "text-green-600"
                      : p.status === "Rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {p.status}
                </td>
                <td className="p-3 border">
                  {p.status === "Pending" && (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => updateStatus(p.id, "Approved")}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, "Rejected")}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
