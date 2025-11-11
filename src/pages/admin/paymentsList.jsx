import { useState, useEffect } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function PaymentsList() {
  const [payments, setPayments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const now = new Date();
        const currentMonth = now.getMonth(); // 0–11
        const currentYear = now.getFullYear();

        // Fetch all pending payments
        const q = query(collection(db, "payments"), where("status", "==", "pending"));
        const snapshot = await getDocs(q);

        // Filter only those uploaded this month
        const filtered = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => {
            if (!p.paymentDate) return false;
            const date = p.paymentDate.toDate ? p.paymentDate.toDate() : new Date(p.paymentDate);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          });

        setPayments(filtered);
      } catch (error) {
        console.error("Error fetching payments:", error);
      }
    };

    fetchPayments();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">This Month’s Pending Payments</h2>

      {payments.length === 0 ? (
        <p className="text-gray-500 text-center">No new payments uploaded this month.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Hostler Name</th>
              <th className="border p-2">Screenshot</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="border p-2 text-center">{p.name || "Unnamed"}</td>
                <td className="border p-2 text-center">
                  {p.screenshot ? (
                    <img
                      src={p.screenshot}
                      alt="screenshot"
                      className="w-16 h-16 object-cover rounded mx-auto"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => navigate(`/admin/paymentDetails/${p.id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
