import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    freeBeds: 0,
    totalHostlers: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      // ✅ Fetch all rooms
      const roomsSnapshot = await getDocs(collection(db, "rooms"));
      const rooms = roomsSnapshot.docs.map((doc) => doc.data());
      const totalRooms = rooms.length;

      // ✅ Count total and occupied beds
      let totalBeds = 0;
      let occupiedBeds = 0;

      rooms.forEach((room) => {
        if (Array.isArray(room.bedNumbers)) {
          totalBeds += room.bedNumbers.length;
          occupiedBeds += room.bedNumbers.filter(
            (bed) => bed.status === "occupied" || bed.hostler
          ).length;
        }
      });

      const freeBeds = totalBeds - occupiedBeds;

      // ✅ Fetch all hostlers
      const hostlersSnapshot = await getDocs(collection(db, "hostlers"));
      const hostlers = hostlersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const totalHostlers = hostlers.length;

      // ✅ Pending payments: based on nextPaymentDate only
      let pendingCount = 0;
      const today = new Date();

      for (const h of hostlers) {
        if (!h.nextPaymentDate) continue;

        const nextPaymentDate = new Date(
          h.nextPaymentDate.seconds
            ? h.nextPaymentDate.seconds * 1000
            : h.nextPaymentDate
        );

        // ✅ Count as pending if due date already passed
        if (today > nextPaymentDate) pendingCount++;
      }

      setStats({
        totalRooms,
        totalBeds,
        occupiedBeds,
        freeBeds,
        totalHostlers,
        pendingPayments: pendingCount,
      });

      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
    );

  const cards = [
    { title: "Total Rooms", value: stats.totalRooms, color: "bg-blue-500" },
    { title: "Total Beds", value: stats.totalBeds, color: "bg-green-500" },
    { title: "Occupied Beds", value: stats.occupiedBeds, color: "bg-yellow-500" },
    { title: "Free Beds", value: stats.freeBeds, color: "bg-purple-500" },
    { title: "Total Hostlers", value: stats.totalHostlers, color: "bg-pink-500" },
    { title: "Pending Payments", value: stats.pendingPayments, color: "bg-red-500" },
  ];

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-semibold mb-6 text-gray-700">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`p-6 rounded-2xl shadow-md text-white ${card.color} transition-transform transform hover:scale-105`}
          >
            <h2 className="text-xl font-medium">{card.title}</h2>
            <p className="text-3xl font-bold mt-3">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
