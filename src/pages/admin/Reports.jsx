import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

export default function Reports() {
  const [payments, setPayments] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const paymentRef = collection(db, "payments");
      let q = query(paymentRef, orderBy("paymentDate", "desc"));

      if (fromDate && toDate) {
        const from = Timestamp.fromDate(new Date(fromDate));
        const to = Timestamp.fromDate(
          new Date(new Date(toDate).setHours(23, 59, 59, 999))
        );
        q = query(
          paymentRef,
          where("paymentDate", ">=", from),
          where("paymentDate", "<=", to),
          orderBy("paymentDate", "desc")
        );
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPayments(data);
      const total = data.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      setTotalRevenue(total);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleFilter = () => {
    fetchPayments();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Payment Report</h1>

      <div className="flex flex-wrap gap-4 justify-center mb-6">
        <div>
          <label className="block text-sm">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border px-3 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border px-3 py-1 rounded"
          />
        </div>
        <button
          onClick={handleFilter}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Filter
        </button>
      </div>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <>
          <table className="w-full border border-gray-300 rounded-lg text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">SL.NO</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-3">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((p, i) => (
                  <tr key={p.id} className="text-center border-t">
                    <td className="p-2 border">{i + 1}</td>
                    <td className="p-2 border">{p.name}</td>
                    <td className="p-2 border">₹{p.amount}</td>
                    <td className="p-2 border">
                      {p.paymentDate?.toDate().toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="text-right font-semibold text-lg mt-4">
            Total Revenue: ₹{totalRevenue}
          </div>
        </>
      )}
    </div>
  );
}
