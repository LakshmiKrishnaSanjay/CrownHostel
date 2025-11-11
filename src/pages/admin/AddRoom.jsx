import { useState } from "react";
import { addRoom } from "../../services/roomService";

export default function AddRoom() {
  const [roomNumber, setRoomNumber] = useState("");
  const [beds, setBeds] = useState(0);
  const [bedNumbers, setBedNumbers] = useState([]);
  const [price, setPrice] = useState(0);
  const [toilet, setToilet] = useState("Yes");
  const [loading, setLoading] = useState(false);

  // Handle number of beds change
  const handleBedsChange = (e) => {
    let count = parseInt(e.target.value) || 0;
    if (count < 0) count = 0;
    setBeds(count);
    setBedNumbers(Array(count).fill(""));
  };

  // Handle each bed number input
  const handleBedNumberChange = (index, value) => {
    const updated = [...bedNumbers];
    updated[index] = value;
    setBedNumbers(updated);
  };

  // Validate form before submitting
  const validateForm = () => {
    if (!roomNumber.trim()) return "Room number is required";
    if (beds > 0 && bedNumbers.some((bed) => !bed.trim()))
      return "All bed numbers must be filled";
    if (!price || parseInt(price) <= 0) return "Price must be greater than 0";
    return null;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorMsg = validateForm();
    if (errorMsg) {
      alert(errorMsg);
      return;
    }

    // Transform bedNumbers into objects with hidden 'vacant' status
    const bedsData = bedNumbers.map((bed) => ({
      number: bed,
      status: "vacant",
    }));

    // Compute room status: 'full' if all occupied, else 'available'
    const roomStatus = bedsData.every(b => b.status === "occupied") ? "full" : "available";

    const roomData = {
      roomNumber,
      beds,
      bedNumbers: bedsData,
      price,
      toilet,
      status: roomStatus, // <-- room status included
    };

    setLoading(true);

    try {
      const roomId = await addRoom(roomData);
      alert(`Room added successfully! ID: ${roomId}`);

      // Reset form
      setRoomNumber("");
      setBeds(0);
      setBedNumbers([]);
      setPrice("");
      setToilet("Yes");
    } catch (error) {
      alert(error.message); // shows duplicate room error or other errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-center">Add New Room</h2>

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
                  value={bed}
                  onChange={(e) =>
                    handleBedNumberChange(index, e.target.value)
                  }
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

        {/* Toilet Facility */}
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
          {loading ? "Adding..." : "Add Room"}
        </button>
      </form>
    </div>
  );
}
