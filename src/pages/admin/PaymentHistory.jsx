import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

export default function PaymentHistory() {
  const { hostlerId } = useParams();
  const [payments, setPayments] = useState([]);
  const [hostler, setHostler] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [statusColor, setStatusColor] = useState("text-gray-600");
  const [pendingInfo, setPendingInfo] = useState({ monthsPending: 0, pendingAmount: 0 });

  const toDate = (value) => {
    if (!value) return null;
    if (value.seconds !== undefined) return new Date(value.seconds * 1000);
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  // full months rounded down between a and b (b >= a)
  const monthsBetweenFloor = (a, b) => {
    if (!a || !b) return 0;
    const ay = a.getFullYear();
    const by = b.getFullYear();
    const am = a.getMonth();
    const bm = b.getMonth();
    const ad = a.getDate();
    const bd = b.getDate();

    let months = (by - ay) * 12 + (bm - am);
    if (bd < ad) months -= 1;
    return months < 0 ? 0 : months;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch hostler
        const hostlerRef = doc(db, "hostlers", hostlerId);
        const hostlerSnap = await getDoc(hostlerRef);
        let hData = null;
        if (hostlerSnap.exists()) {
          hData = { id: hostlerSnap.id, ...hostlerSnap.data() };
          setHostler(hData);
        }

        // fetch payments
        const q = query(collection(db, "payments"), where("hostlerId", "==", hostlerId));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // sort by paymentDate ascending
        data.sort((x, y) => {
          const xd = toDate(x.paymentDate) || new Date(0);
          const yd = toDate(y.paymentDate) || new Date(0);
          return xd - yd;
        });
        setPayments(data);

        // calculate status
        const today = new Date();

        const lastPayment = data.length ? data[data.length - 1] : null;
        const lastPaymentDate = lastPayment ? toDate(lastPayment.paymentDate) : null;

        // determine dueDate
        let dueDate = toDate(hData?.nextPaymentDate) || null;
        if (!dueDate) {
          if (lastPaymentDate) {
            const d = new Date(lastPaymentDate.getTime());
            d.setMonth(d.getMonth() + 1);
            dueDate = d;
          } else if (hData?.joiningDate) {
            const j = toDate(hData.joiningDate);
            if (j) {
              const d = new Date(j.getTime());
              d.setMonth(d.getMonth() + 1);
              dueDate = d;
            }
          }
        }

        if (!dueDate) {
          setStatusText("No due date available");
          setStatusColor("text-gray-600");
        } else {
          if (today <= dueDate) {
            setStatusText("Up to date");
            setStatusColor("text-green-600");
            setPendingInfo({ monthsPending: 0, pendingAmount: 0 });
          } else {
            const fullMonths = monthsBetweenFloor(dueDate, today);
            const monthsPending = fullMonths + 1;

            const lastAmt = lastPayment?.amount || 0;
            const pendingAmount = monthsPending * lastAmt;

            setPendingInfo({ monthsPending, pendingAmount });

            if (monthsPending === 1) {
              setStatusText("1 month pending");
              setStatusColor("text-orange-500");
            } else {
              setStatusText(`${monthsPending} months pending`);
              setStatusColor("text-red-600");
            }
          }
        }
      } catch (err) {
        console.error("Error fetching payment history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hostlerId]);

  if (loading) return <p className="text-center text-gray-500 mt-10">Loading...</p>;

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    const d = toDate(dateValue);
    if (!d) return "-";
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const computeShownDue = () => {
    if (hostler?.nextPaymentDate) return toDate(hostler.nextPaymentDate);
    if (payments.length) {
      const lp = payments[payments.length - 1];
      const d = toDate(lp.paymentDate);
      if (d) {
        const nd = new Date(d.getTime());
        nd.setMonth(nd.getMonth() + 1);
        return nd;
      }
    }
    if (hostler?.joiningDate) {
      const j = toDate(hostler.joiningDate);
      if (j) {
        const nd = new Date(j.getTime());
        nd.setMonth(nd.getMonth() + 1);
        return nd;
      }
    }
    return null;
  };

  const shownDueDate = computeShownDue();

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
              {hostler.roomNumber ? `Room No: ${hostler.roomNumber}` : ""}{" "}
              {hostler.bedNo ? `Bed: ${hostler.bedNo}` : ""}
            </p>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <p className={`text-lg font-semibold mb-1 ${statusColor}`}>{statusText}</p>
        <p className="text-md text-gray-700">
          Due Date: <span className="font-medium">{shownDueDate ? formatDate(shownDueDate) : "-"}</span>
        </p>

        {pendingInfo.monthsPending > 0 && (
          <p className="text-md text-red-600 font-semibold mt-1">
            Pending Amount: ₹{pendingInfo.pendingAmount.toLocaleString()}
          </p>
        )}
      </div>

      <h3 className="text-xl font-semibold mb-3">Payment History</h3>

      {payments.length === 0 ? (
        <p className="text-center text-gray-500">No payments found for this hostler.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="border p-2">Room</th>
              <th className="border p-2">Joining Date</th>
              <th className="border p-2">Last Payment Date</th>
              <th className="border p-2">Due Date</th>
              <th className="border p-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="text-center">
                <td className="border p-2">
                  {hostler?.roomNumber ? `Room ${hostler.roomNumber}` : ""}{" "}
                  {hostler?.bedNo ? `, Bed ${hostler.bedNo}` : ""}
                </td>
                <td className="border p-2">{formatDate(hostler?.joiningDate)}</td>
                <td className="border p-2">{p.paymentDate ? formatDate(p.paymentDate) : "No Payment"}</td>
                <td className="border p-2">{shownDueDate ? formatDate(shownDueDate) : "-"}</td>
                <td className="border p-2">₹{p.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
