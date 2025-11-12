import { useState, useEffect } from "react";
import { db } from "../../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

export default function EditRoom() {
  const { id } = useParams(); // room id from URL
  const navigate = useNavigate();

  const [roomNumber, setRoomNumber] = useState("");
  const [beds, setBeds] = useState(0);
  const [bedNumbers, setBedNumbers] = useState([]);
  const [price, setPrice] = useState(0);
  const [toilet, setToilet] = useState("Yes");
  const [loading, setLoading] = useState(false);

  // Fetch existing room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const roomRef = doc(db, "rooms", id);
        const roomSnap = await getDoc(roomRef);
        if (roomSnap.exists()) {
          const data = roomSnap.data();
          setRoomNumber(data.roomNumber || "");
          setBeds(data.beds || 0);
          setBedNumbers(data.bedNumbers || []);
          setPrice(data.price || 0);
          setToilet(data.toilet || "Yes");
        } else {
          alert("Room not found");
          navigate("/admin/viewroom");
        }
      } catch (error) {
        console.error("Error loading room:", error);
      }
    };
    fetchRoom();
  }, [id, navigate]);

  // Handle number of beds change
  const handleBedsChange = (e) => {
    let count = parseInt(e.target.value) || 0;
    if (count < 0) count = 0;
    setBeds(count);
    setBedNumbers((prev) => {
      const updated = [...prev];
      if (count > prev.length) {
        for (let i = prev.length; i < count; i++)
          updated.push({ number: "", status: "vacant" });
      } else {
        updated.length = count;
      }
      return updated;
    });
  };

  // Handle bed number input
  const handleBedNumberChange = (index, value) => {
    const updated = [...bedNumbers];
    updated[index].number = value;
    setBedNumbers(updated);
  };

  // Validate form
  const validateForm = () => {
    if (!roomNumber.trim()) return "Room number is required";
    if (beds > 0 && bedNumbers.some((bed) => !bed.number.trim()))
      return "All bed numbers must be filled";
    if (!price || parseInt(price) <= 0) return "Price must be greater than 0";
    return null;
  };

  // Submit updated data
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) return alert(errorMsg);

    // Keep old bed statuses (if already set)
    const bedsData = bedNumbers.map((bed) => ({
      number: bed.number,
      status: bed.status || "vacant",
      hostler: bed.hostler || null,
    }));

    const roomStatus = bedsData.every((b) => b.status === "occupied")
      ? "full"
      : "available";

    const updatedRoom = {
      roomNumber,
      beds,
      bedNumbers: bedsData,
      price,
      toilet,
      status: roomStatus,
    };

    try {
      setLoading(true);

      // ✅ Update room details
      await updateDoc(doc(db, "rooms", id), updatedRoom);

      // ✅ Update related hostlers with new room number
      const hostlersRef = collection(db, "hostlers");
      const q = query(hostlersRef, where("roomId", "==", id));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnap) => {
          batch.update(docSnap.ref, { roomNumber });
        });
        await batch.commit();
      }

      alert("Room updated successfully!");
      navigate("/admin/viewroom");
    } catch (error) {
      console.error("Error updating room:", error);
      alert("Failed to update room.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-center">Edit Room</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Room Number */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Room Number
          </label>
          <input
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter room number"
          />
        </div>

        {/* Number of Beds */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Number of Beds
          </label>
          <input
            type="number"
            min="0"
            value={beds}
            onChange={handleBedsChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Bed Numbers */}
        {beds > 0 && (
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Bed Numbers
            </label>
            <div className="space-y-2">
              {bedNumbers.map((bed, index) => (
                <input
                  key={index}
                  type="text"
                  value={bed.number}
                  onChange={(e) => handleBedNumberChange(index, e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder={`Bed ${index + 1} number`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Room Price (₹)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter room price"
          />
        </div>

        {/* Toilet */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Toilet Facility
          </label>
          <select
            value={toilet}
            onChange={(e) => setToilet(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Room"}
        </button>
      </form>
    </div>
  );
}
