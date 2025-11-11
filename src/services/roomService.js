import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, query, where, getDocs, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";

/**
 * Add a new room to Firestore if roomNumber doesn't exist
 * @param {Object} roomData - { roomNumber, beds, bedNumbers, price, toilet }
 */
export const addRoom = async (roomData) => {
  try {
    const roomRef = collection(db, "rooms");

    // Check if room number already exists
    const q = query(roomRef, where("roomNumber", "==", roomData.roomNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error(`Room number ${roomData.roomNumber} already exists`);
    }

    // Add new room
    const docRef = await addDoc(roomRef, {
      ...roomData,
      createdAt: serverTimestamp(),
    });

    return docRef.id; // return the ID of the newly added room
  } catch (error) {
    console.error("Error adding room:", error);
    throw error;
  }
};


/**
 * Updates a room's details and its bed status
 * @param {string} roomId 
 * @param {object} updatedData - {roomNumber, beds, price, toilet, status, bedNumbers}
 */
export const updateRoom = async (roomId, updatedData) => {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) throw new Error("Room not found");

  // Merge the existing data with updatedData
  const roomData = {
    ...roomSnap.data(),
    ...updatedData,
  };

  await updateDoc(roomRef, roomData);
  return true;
};