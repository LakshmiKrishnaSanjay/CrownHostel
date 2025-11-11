import { useState, useEffect } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { addHostler } from "../../services/hostlerService";

// ✅ Normalize phone to +91XXXXXXXXXX
const normalizePhone = (phone) =>
  phone.startsWith("+91") ? phone : "+91" + phone.replace(/\D/g, "");

export default function RegisterHostler() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [vacantBeds, setVacantBeds] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Payment info state
  const [paymentInfo, setPaymentInfo] = useState(null);

  // Fetch rooms
  const fetchRooms = async () => {
    const snapshot = await getDocs(collection(db, "rooms"));
    const roomsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setRooms(roomsData);
  };

  useEffect(() => { fetchRooms(); }, []);

  useEffect(() => {
    if (selectedRoom) {
      const room = rooms.find((r) => r.id === selectedRoom);
      setVacantBeds(room?.bedNumbers.filter((b) => b.status === "vacant") || []);
      setSelectedPrice(room?.price || "");
    } else {
      setVacantBeds([]);
      setSelectedPrice("");
    }
  }, [selectedRoom, rooms]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);

    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) return alert("Select a room and bed");

    const room = rooms.find((r) => r.id === selectedRoom);
    const bedNo = e.target.bedNo.value;
    const joiningDate = e.target.joiningDate.value;

    // ✅ Normalize phone
    const phoneNormalized = normalizePhone(e.target.phone.value);

    // ✅ Check if phone already exists
    const phoneQuery = query(collection(db, "hostlers"), where("phone", "==", phoneNormalized));
    if (!(await getDocs(phoneQuery)).empty) {
      return alert("Phone already exists!");
    }

    const hostlerData = {
      name: e.target.name.value,
      phone: phoneNormalized, // store in +91 format
      aadhar: e.target.aadhar.value,
      roomId: room.id,
      roomNumber: room.roomNumber,
      bedNo: bedNo,
      price: room.price,
      joiningDate,
      paymentType: "Monthly",
      roomBeds: room.bedNumbers,
      image,
      role: "hostler",
    };

    try {
      setLoading(true);
      const hostlerId = await addHostler(hostlerData);

      // Initial payment info (0 pending)
      const joining = new Date(joiningDate);
      const nextPayment = new Date(joining);
      nextPayment.setMonth(nextPayment.getMonth() + 1);

      setPaymentInfo({
        joiningDate,
        pendingMonths: 0,
        nextPaymentDate: nextPayment.toISOString().split("T")[0],
      });

      alert(`Hostler added successfully! ID: ${hostlerId}`);
      e.target.reset();
      setPreview(null);
      setSelectedRoom("");
      fetchRooms();
    } catch (err) {
      alert(err.message);
      console.error("Failed to add hostler:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow-md rounded-2xl p-8">
      <h2 className="text-2xl font-semibold mb-6 text-center">🏠 Register Hostler</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label>Name</label>
          <input name="name" type="text" required className="w-full border rounded p-2" />
        </div>
        <div>
          <label>Phone</label>
          <input name="phone" type="number" required className="w-full border rounded p-2" />
        </div>
        <div>
          <label>Aadhar</label>
          <input
            name="aadhar"
            type="text"
            maxLength="12"
            required
            pattern="\d{12}"
            title="Aadhar number must be 12 digits"
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label>Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="w-full border rounded p-2" />
          {preview && <img src={preview} alt="Preview" className="w-28 h-28 mt-2 rounded-full object-cover" />}
        </div>
        <div>
          <label>Room</label>
          <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="w-full border rounded p-2">
            <option value="">-- Select Room --</option>
            {rooms.filter(r => r.bedNumbers.some(b => b.status === "vacant")).map(r => (
              <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Bed</label>
          <select name="bedNo" required className="w-full border rounded p-2">
            <option value="">-- Select Vacant Bed --</option>
            {vacantBeds.map(b => <option key={b.number} value={b.number}>Bed {b.number}</option>)}
          </select>
        </div>
        <div>
          <label>Joining Date</label>
          <input name="joiningDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="w-full border rounded p-2" />
        </div>
        <div>
          <label>Price (₹)</label>
          <input name="price" type="number" value={selectedPrice} readOnly className="w-full border rounded p-2 bg-gray-100 text-gray-700" />
        </div>
        <div className="text-center">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {/* Payment Info */}
      {paymentInfo && (
        <div className="mt-8 bg-gray-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">💰 Initial Payment Info</h3>
          <p><strong>Joining Date:</strong> {paymentInfo.joiningDate}</p>
          <p><strong>Pending Months:</strong> {paymentInfo.pendingMonths}</p>
          <p><strong>Next Payment Date:</strong> {paymentInfo.nextPaymentDate}</p>
        </div>
      )}
    </div>
  );
}
