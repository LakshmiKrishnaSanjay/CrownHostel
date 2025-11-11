import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function PendingPayments() {
  const [hostlers, setHostlers] = useState([]);
  const [loading, setLoading] = useState(true);
  const siteLink = "https://yourappurl.com"; // 🔗 replace with your actual site URL

  useEffect(() => {
    const fetchHostlers = async () => {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "hostlers"));
      const today = new Date();

      const list = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        if (!data.nextPaymentDate) continue;

        // ✅ Convert nextPaymentDate (Firestore Timestamp or JS Date)
        const nextPaymentDate = new Date(
          data.nextPaymentDate.seconds
            ? data.nextPaymentDate.seconds * 1000
            : data.nextPaymentDate
        );

        // ✅ If nextPaymentDate < today → pending
        if (nextPaymentDate < today) {
          list.push({
            id: docSnap.id,
            name: data.name || "Unnamed",
            roomNumber: data.roomNumber || "-",
            bedNumber: data.bedNo || "-",
            price: data.price || "-",
            phone: data.phone || "N/A",
            dueDate: nextPaymentDate.toLocaleDateString(),
          });
        }
      }

      setHostlers(list);
      setLoading(false);
    };

    fetchHostlers();
  }, []);

  const handleSendMessage = (h) => {
    const message = `Hello ${h.name}, your payment of ₹${h.price} is pending.\nDue Date: ${h.dueDate}\nPlease pay here: ${siteLink}`;
    const whatsappLink = `https://wa.me/${h.phone}?text=${encodeURIComponent(
      message
    )}`;

    if (h.phone && h.phone !== "N/A") {
      window.open(whatsappLink, "_blank");
    } else {
      alert("No phone number found for this hostler!");
    }
  };

  if (loading)
    return (
      <p className="text-center text-gray-500 mt-10">
        Loading pending payments...
      </p>
    );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Pending Payments</h2>

      {hostlers.length === 0 ? (
        <p className="text-center text-gray-500">
          No pending payments found 🎉
        </p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="border p-2">Name</th>
              <th className="border p-2">Room</th>
              <th className="border p-2">Bed</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Phone</th>
              <th className="border p-2">Due Date</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {hostlers.map((h) => (
              <tr key={h.id} className="text-center">
                <td className="border p-2">{h.name}</td>
                <td className="border p-2">{h.roomNumber}</td>
                <td className="border p-2">{h.bedNumber}</td>
                <td className="border p-2">₹{h.price}</td>
                <td className="border p-2">{h.phone}</td>
                <td className="border p-2">{h.dueDate}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleSendMessage(h)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                  >
                    Send Message
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
