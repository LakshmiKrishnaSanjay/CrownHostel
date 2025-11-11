import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebaseConfig";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { updateHostler } from "../../services/hostlerService";

export default function EditHostler() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hostler, setHostler] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [vacantBeds, setVacantBeds] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedBed, setSelectedBed] = useState("");
  const [roomPrice, setRoomPrice] = useState("");
  const [preview, setPreview] = useState(null);
  const [image, setImage] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Fetch hostler + rooms
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Hostler
        const hostlerRef = doc(db, "hostlers", id);
        const hostlerSnap = await getDoc(hostlerRef);
        if (!hostlerSnap.exists()) throw new Error("Hostler not found!");
        const data = hostlerSnap.data();
        setHostler(data);
        setSelectedRoom(data.roomId);
        setSelectedBed(data.bedNo);
        setRoomPrice(data.price);
        setPreview(data.image || null);

        // Rooms
        const roomsSnap = await getDocs(collection(db, "rooms"));
        const roomsData = roomsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRooms(roomsData);
      } catch (err) {
        console.error(err);
        alert(err.message);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id]);

  // Update vacant beds when room changes
  useEffect(() => {
    if (!selectedRoom || !rooms.length || !hostler) return;
    const room = rooms.find((r) => r.id === selectedRoom);
    if (!room) return;
    const beds = room.bedNumbers.filter(
      (b) => b.status === "vacant" || b.number === hostler.bedNo
    );
    setVacantBeds(beds);
    setRoomPrice(room.price || 0);
  }, [selectedRoom, rooms, hostler]);

  // Image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hostler) return;

    const updatedData = {
      name: e.target.name.value,
      phone: e.target.phone.value,
      aadhar: e.target.aadhar.value,
      roomId: selectedRoom,
      bedNo: selectedBed,
      joiningDate: e.target.joiningDate.value,
      nextPaymentDate: e.target.nextPaymentDate.value,
      price: roomPrice,
      image: image || hostler.image,
    };

    try {
      setLoadingSubmit(true);
      await updateHostler(id, updatedData);
      alert("Hostler updated successfully!");
      navigate("/admin/viewhostlers");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update hostler");
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingData || !hostler) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        Loading hostler details...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow-md rounded-2xl p-8">
      <h2 className="text-2xl font-semibold mb-6 text-center">✏️ Edit Hostler</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label>Name</label>
          <input
            name="name"
            type="text"
            defaultValue={hostler.name}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Phone */}
        <div>
          <label>Phone</label>
          <input
            name="phone"
            type="text"
            defaultValue={hostler.phone}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Aadhar */}
        <div>
          <label>Aadhar</label>
          <input
            name="aadhar"
            type="text"
            maxLength={12}
            defaultValue={hostler.aadhar}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Image */}
        <div>
          <label>Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border rounded p-2"
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-28 h-28 mt-2 rounded-full object-cover"
            />
          )}
        </div>

        {/* Room */}
        <div>
          <label>Room</label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">-- Select Room --</option>
            {rooms
              .filter(
                (r) => r.bedNumbers.some((b) => b.status === "vacant") || r.id === hostler.roomId
              )
              .map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber}
                </option>
              ))}
          </select>
        </div>

        {/* Bed */}
        <div>
          <label>Bed</label>
          <select
            name="bedNo"
            required
            value={selectedBed}
            onChange={(e) => setSelectedBed(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">-- Select Vacant Bed --</option>
            {vacantBeds.map((b) => (
              <option key={b.number} value={b.number}>
                Bed {b.number}
              </option>
            ))}
          </select>
        </div>

        {/* Joining Date */}
        <div>
          <label>Joining Date</label>
          <input
            name="joiningDate"
            type="date"
            defaultValue={hostler.joiningDate}
            className="w-full border rounded p-2"
          />
        </div>

        {/* Next Payment Date */}
        <div>
          <label>Next Payment Date</label>
          <input
            name="nextPaymentDate"
            type="date"
            defaultValue={hostler.nextPaymentDate || ""}
            className="w-full border rounded p-2"
          />
        </div>

        {/* Price */}
        <div>
          <label>Price (₹)</label>
          <input
            type="number"
            value={roomPrice}
            readOnly
            className="w-full border rounded p-2 bg-gray-100 text-gray-700"
          />
        </div>

        <div className="text-center">
          <button
            type="submit"
            disabled={loadingSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            {loadingSubmit ? "Updating..." : "Update Hostler"}
          </button>
        </div>
      </form>
    </div>
  );
}
