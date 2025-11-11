import { useState, useEffect, use } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { deleteHostler, refreshHostlerStatus } from "../../services/hostlerService";
import { useNavigate } from "react-router-dom";

export default function ViewHostlers() {
  const [hostlers, setHostlers] = useState([]);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  // ✅ Fetch and update hostler status based on next payment date
  const fetchHostlers = async () => {
    try {
      // Call service to refresh status if needed
      await refreshHostlerStatus();

      const hostlerSnap = await getDocs(collection(db, "hostlers"));
      const today = new Date();

      const hostlerData = hostlerSnap.docs.map((doc) => {
        const data = doc.data();

        // Convert joining and next payment dates to Date objects
        const joiningDate = new Date(data.joiningDate);
        let nextPaymentDate = data.nextPaymentDate
          ? new Date(data.nextPaymentDate)
          : new Date(joiningDate.getFullYear(), joiningDate.getMonth() + 1, joiningDate.getDate()); // first payment due 1 month after joining

        // Determine status
        const status =
          today > nextPaymentDate
            ? "Pending"
            : "Paid";

        return {
          id: doc.id,
          ...data,
          status,
          nextPaymentDate: nextPaymentDate.toISOString().split("T")[0], // format YYYY-MM-DD
        };
      });

      setHostlers(hostlerData);
    } catch (err) {
      console.error("Failed to fetch hostlers:", err);
    }
  };

  useEffect(() => {
    fetchHostlers();
  }, []);

  // ✅ Delete hostler
  const handleDelete = async (hostler) => {
    if (!window.confirm(`Are you sure you want to delete ${hostler.name}?`)) return;
    try {
      await deleteHostler(hostler.id, hostler.roomId, hostler.bedNo);
      alert("Hostler deleted successfully!");
      fetchHostlers();
    } catch (err) {
      console.error("Failed to delete hostler:", err);
      alert(`Failed to delete hostler: ${err.message}`);
    }
  };

  // ✅ Filter hostlers by status
  const filteredHostlers = hostlers.filter((h) => {
    if (filter === "paid") return h.status.toLowerCase() === "paid";
    if (filter === "pending") return h.status.toLowerCase() === "pending";
    return true;
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">🏠 Hostlers List</h2>

        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="filter" checked={filter === "all"} onChange={() => setFilter("all")} />
            All
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="filter" checked={filter === "paid"} onChange={() => setFilter("paid")} />
            Paid
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="filter" checked={filter === "pending"} onChange={() => setFilter("pending")} />
            Pending
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-3 font-medium text-gray-600">Hostler</th>
              <th className="px-5 py-3 font-medium text-gray-600">Phone</th>
              <th className="px-5 py-3 font-medium text-gray-600">Aadhar</th>
              <th className="px-5 py-3 font-medium text-gray-600">Room</th>
              <th className="px-5 py-3 font-medium text-gray-600">Bed</th>
              <th className="px-5 py-3 font-medium text-gray-600">Status</th>
              <th className="px-5 py-3 font-medium text-gray-600">Rent</th>
              <th className="px-5 py-3 font-medium text-gray-600">Joining Date</th>
              <th className="px-5 py-3 font-medium text-gray-600">Next Payment</th>
              <th className="px-5 py-3 font-medium text-gray-600 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredHostlers.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50 transition">
<td className="px-5 py-4 flex items-center gap-3">
  {h.image && <img src={h.image} alt={h.name} className="w-10 h-10 rounded-full object-cover border" />}
  <button
    onClick={() => navigate(`/admin/payment-history/${h.id}`)}
    className="font-medium text-blue-600 hover:underline"
  >
    {h.name}
  </button>
</td>

                <td className="px-5 py-4 text-gray-600">{h.phone}</td>
                <td className="px-5 py-4 text-gray-600">{h.aadhar}</td>
                <td className="px-5 py-4 text-gray-600">{h.roomNumber}</td>
                <td className="px-5 py-4 text-gray-600">{h.bedNo}</td>
                <td className="px-5 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      h.status.toLowerCase() === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {h.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-600">₹{h.price}</td><td className="px-5 py-4 text-gray-600">
  {new Date(h.joiningDate).toLocaleDateString("en-GB")}
</td>
<td className="px-5 py-4 text-gray-600">
  {new Date(h.nextPaymentDate).toLocaleDateString("en-GB")}
</td>

                <td className="px-5 py-4 text-center">

                  <button
  className="text-blue-600 hover:underline mr-3"
  onClick={() => navigate(`/admin/edit-hostler/${h.id}`)}
>
  Edit
</button>


                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(h)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredHostlers.length === 0 && (
              <tr>
                <td colSpan="10" className="px-5 py-4 text-center text-gray-500">
                  No hostlers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
