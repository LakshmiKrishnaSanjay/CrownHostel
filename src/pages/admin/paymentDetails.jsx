import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  collection,
} from "firebase/firestore";

export default function PaymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [hostler, setHostler] = useState(null);
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [numPayments, setNumPayments] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      // Get payment details
      const paymentDoc = await getDoc(doc(db, "payments", id));
      if (!paymentDoc.exists()) return;

      const paymentData = { id: paymentDoc.id, ...paymentDoc.data() };
      setPayment(paymentData);

      // Set existing values
      setNumPayments(paymentData.numPayments || "");
      setAmount(paymentData.amount || "");

      // Get hostler details
      const hostlerQuery = query(
        collection(db, "hostlers"),
        where("__name__", "==", paymentData.hostlerId)
      );
      const hostlerSnap = await getDocs(hostlerQuery);

      if (!hostlerSnap.empty) {
        const hostlerData = {
          id: hostlerSnap.docs[0].id,
          ...hostlerSnap.docs[0].data(),
        };
        setHostler(hostlerData);

        // ✅ Auto set next payment date = one month after existing nextPaymentDate
        if (hostlerData.nextPaymentDate) {
          const oldDate = new Date(hostlerData.nextPaymentDate);
          const newDate = new Date(oldDate);
          newDate.setMonth(newDate.getMonth() + 1);

          const formatted = newDate.toISOString().split("T")[0];
          setNextPaymentDate(formatted);
        }
      }
    };

    fetchData();
  }, [id]);

  const handleUpdate = async () => {
    if (!nextPaymentDate || !amount || !numPayments) {
      alert("Please fill all fields before updating!");
      return;
    }

    // Update hostler record
    const hostlerRef = doc(db, "hostlers", payment.hostlerId);
    await updateDoc(hostlerRef, {
      nextPaymentDate,
      status: "Paid",
    });

    // Update payment record
    await updateDoc(doc(db, "payments", id), {
      status: "paid",
      amount,
      numPayments,
    });

    alert("✅ Payment updated successfully!");
    navigate("/admin/paymentList");
  };

  if (!payment || !hostler)
    return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Payment Details</h2>

      <div className="space-y-4">
        <p>
          <strong>Name:</strong> {payment.name}
        </p>
        <p>
          <strong>Joining Date:</strong> {hostler.joiningDate}
        </p>
        <p>
          <strong>Due Date:</strong> {hostler.nextPaymentDate}
        </p>
        <p>
          <strong>Payment Date:</strong>{" "}
          {new Date(payment.paymentDate?.seconds * 1000).toLocaleString()}
        </p>

        <div>
          <strong>Screenshot:</strong>
          <img
            src={payment.screenshot}
            alt="Payment Screenshot"
            className="w-full max-w-md mt-2 border rounded-lg"
          />
        </div>

        {/* ✅ New Fields */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block font-medium mb-1">Number of Payments</label>
            <input
              type="number"
              value={numPayments}
              onChange={(e) => setNumPayments(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-full"
              placeholder="e.g. 2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Amount (₹)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-full"
              placeholder="e.g. 7000"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mt-4 mb-1">Next Payment Date</label>
          <input
            type="date"
            value={nextPaymentDate}
            onChange={(e) => setNextPaymentDate(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 w-full"
          />
          <p className="text-gray-500 text-sm mt-1">
            (Automatically set to one month after the current date — you can change it if needed)
          </p>
        </div>

        <button
          onClick={handleUpdate}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg mt-4"
        >
          Update Payment
        </button>
      </div>
    </div>
  );
}
