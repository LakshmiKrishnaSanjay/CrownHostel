import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, doc, deleteDoc, orderBy, query } from "firebase/firestore";

export default function ViewRooms() {
  const [filter, setFilter] = useState("all");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch rooms from Firestore
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const roomsRef = collection(db, "rooms");
      const q = query(roomsRef, orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);

      const roomsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(roomsData);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Delete room
  const handleDelete = async (roomId) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      await deleteDoc(doc(db, "rooms", roomId));
      fetchRooms();
    }
  };

  // Flatten beds with room info for filtering
  const filteredBeds = rooms.flatMap((room) =>
    room.bedNumbers
      .filter((bed) => {
        if (filter === "occupied") return bed.status === "occupied";
        if (filter === "vacant") return bed.status === "vacant";
        return true;
      })
      .map((bed) => ({
        roomId: room.id,
        roomNumber: room.roomNumber,
        bedNumber: bed.number,
        price: room.price,
        status: bed.status,
        hostler: bed.hostler || "-", // optional
        toilet: room.toilet,
      }))
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">View Rooms</h2>

      {/* Filter Options */}
      <div className="flex justify-center mb-6 gap-6">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="filter"
            value="all"
            checked={filter === "all"}
            onChange={(e) => setFilter(e.target.value)}
          />
          All
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="filter"
            value="occupied"
            checked={filter === "occupied"}
            onChange={(e) => setFilter(e.target.value)}
          />
          Occupied
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="filter"
            value="vacant"
            checked={filter === "vacant"}
            onChange={(e) => setFilter(e.target.value)}
          />
          Vacant
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Room No</th>
              <th className="px-4 py-2 text-left">Bed No</th>
              <th className="px-4 py-2 text-left">Price (₹)</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Hostler</th>
              <th className="px-4 py-2 text-left">Toilet</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Loading rooms...
                </td>
              </tr>
            ) : filteredBeds.length > 0 ? (
              filteredBeds.map((bed, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{bed.roomNumber}</td>
                  <td className="px-4 py-2">{bed.bedNumber}</td>
                  <td className="px-4 py-2">{bed.price}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bed.status === "occupied"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {bed.status.charAt(0).toUpperCase() + bed.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-2">{bed.hostler}</td>
                  <td className="px-4 py-2">{bed.toilet}</td>
                  <td className="px-4 py-2 flex gap-3">
                    <button className="text-indigo-600 hover:text-indigo-800"
                      onClick={() => window.location.href = `/admin/edit-room/${bed.roomId}`} >
                      <Edit size={18} />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDelete(bed.roomId)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No rooms found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
