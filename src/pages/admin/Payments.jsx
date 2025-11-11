import { useState, useEffect } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function Payments({ hostlerId }) {
  const [hostler, setHostler] = useState(null);
  const [payments, setPayments] = useState([]);
  const [pendingMonths, setPendingMonths] = useState(0);
  const [status, setStatus] = useState("No Pending");
  const [nextPaymentDate, setNextPaymentDate] = useState(null);

  useEffect(() => {
    const fetchHostler = async () => {
      // Fetch hostler
      const hostlerSnap = await getDocs(collection(db, "hostlers"));
      const data = hostlerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const h = data.find(h => h.id === hostlerId);
      setHostler(h);

      if (!h) return;

      // Fetch payments
      const paymentSnap = await getDocs(collection(db, "payments"));
      const hostlerPayments = paymentSnap.docs
        .map(doc => doc.data())
        .filter(p => p.hostlerId === hostlerId);
      setPayments(hostlerPayments);

      const joining = new Date(h.joiningDate);
      const today = new Date();

      // Calculate total months
      const totalMonths =
        (today.getFullYear() - joining.getFullYear()) * 12 +
        (today.getMonth() - joining.getMonth()) +
        (today.getDate() >= joining.getDate() ? 1 : 0);

      let pending = 0;
      let nextPayment = null;

      for (let i = 0; i < totalMonths; i++) {
        const dueDate = new Date(joining.getFullYear(), joining.getMonth() + i, joining.getDate());
        const dueStr = dueDate.toISOString().slice(0, 10); // YYYY-MM-DD
        const paid = hostlerPayments.some(p => p.month === dueStr && p.status === "paid");
        if (!paid) {
          pending++;
          if (!nextPayment) nextPayment = dueStr; // first unpaid month
        }
      }

      setPendingMonths(pending);
      setStatus(pending > 0 ? "Pending" : "No Pending");
      setNextPaymentDate(nextPayment);
    };

    fetchHostler();
  }, [hostlerId]);

  if (!hostler) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded-xl">
      <h2 className="text-2xl font-semibold mb-4">{hostler.name} Payments</h2>
      <p><strong>Phone:</strong> {hostler.phone}</p>
      <p><strong>Monthly Amount:</strong> ₹{hostler.price}</p>
      <p><strong>Status:</strong> {status}</p>
      {status === "Pending" && (
        <>
          <p><strong>Months Not Paid:</strong> {pendingMonths}</p>
          <p><strong>Next Payment Date:</strong> {nextPaymentDate}</p>
        </>
      )}
    </div>
  );
}
