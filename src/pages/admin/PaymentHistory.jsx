import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

export default function PaymentHistory() {
  const { hostlerId } = useParams();
  const [payments, setPayments] = useState([]);
  const [hostler, setHostler] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hostler details
        const hostlerRef = doc(db, "hostlers", hostlerId);
        const hostlerSnap = await getDoc(hostlerRef);
        if (hostlerSnap.exists()) {
          setHostler({ id: hostlerSnap.id, ...hostlerSnap.data() });
        }

        // Fetch payment history
        const q = query(collection(db, "payments"), where("hostlerId", "==", hostlerId));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setPayments(data);
      } catch (err) {
        console.error("Error fetching payment history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hostlerId]);

  if (loading) return <p className="text-center text-gray-500 mt-10">Loading...</p>;

  // ✅ Helper to format date as DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-6">
      {hostler && (
        <div className="flex items-center gap-4 mb-6 border-b pb-4">
          <img
            src={hostler.image || "https://via.placeholder.com/80"}
            alt={hostler.name}
            className="w-20 h-20 rounded-full object-cover border"
          />
          <div>
            <h2 className="text-2xl font-semibold">{hostler.name}</h2>
            <p className="text-gray-500">{hostler.phone}</p>
            <p className="text-gray-500">
              {hostler.roomNumber ? `Room No: ${hostler.roomNumber}` : ""}
            </p>
          </div>
        </div>
      )}

      <h3 className="text-xl font-semibold mb-3">Payment History</h3>

      {payments.length === 0 ? (
        <p className="text-center text-gray-500">No payments found for this hostler.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="border p-2">Room </th>
              <th className="border p-2">Joining Date</th>
              <th className="border p-2">Payment Date</th>
              <th className="border p-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="text-center">
                <td className="border p-2">{hostler.roomNumber ? `Room : ${hostler.roomNumber}` : ""} , {hostler.bedNo ? `Bed : ${hostler.bedNo}` : ""}</td>
                <td className="border p-2">{formatDate(hostler.joiningDate)}</td>
                <td className="border p-2">
                  {p.paymentDate?.seconds
                    ? new Date(p.paymentDate.seconds * 1000).toLocaleDateString("en-GB")
                    : "No Payment"}
                </td>
                <td className="border p-2">₹{p.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
