import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

/**
 * Add a new hostler with initial pending payment and next payment date
 */
export const addHostler = async (hostlerData) => {
  if (!/^\d{12}$/.test(hostlerData.aadhar)) throw new Error("Aadhar must be 12 digits!");

  const phoneQuery = query(collection(db, "hostlers"), where("phone", "==", hostlerData.phone));
  if (!(await getDocs(phoneQuery)).empty) throw new Error("Phone already exists!");

  const aadharQuery = query(collection(db, "hostlers"), where("aadhar", "==", hostlerData.aadhar));
  if (!(await getDocs(aadharQuery)).empty) throw new Error("Aadhar already exists!");

  const joiningDate = new Date(hostlerData.joiningDate);
  const nextPaymentDate = new Date(joiningDate);
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

  const hostlerRef = await addDoc(collection(db, "hostlers"), {
    ...hostlerData,
    role: "hostler",
    createdAt: new Date(),
    status: "Pending",
    pendingMonths: 0,
    nextPaymentDate: nextPaymentDate.toISOString().slice(0, 10),
  });

  await addDoc(collection(db, "payments"), {
    hostlerId: hostlerRef.id,
    month: joiningDate.toISOString().slice(0, 10),
    amount: hostlerData.price,
    status: "pending",
    createdAt: new Date(),
  });

  const roomRef = doc(db, "rooms", hostlerData.roomId);
  const updatedBeds = hostlerData.roomBeds.map(b =>
    b.number === hostlerData.bedNo ? { ...b, status: "occupied", hostler: hostlerData.name } : b
  );
  const isRoomFull = updatedBeds.every(b => b.status === "occupied");
  await updateDoc(roomRef, { bedNumbers: updatedBeds, status: isRoomFull ? "full" : "available" });

  return hostlerRef.id;
};

/**
 * Auto-check and update hostler payment status (Paid → Pending)
 */
export const refreshHostlerStatus = async () => {
  const hostlerSnap = await getDocs(collection(db, "hostlers"));
  const today = new Date();

  for (const hDoc of hostlerSnap.docs) {
    const h = { id: hDoc.id, ...hDoc.data() };

    if (h.status === "Paid" && h.nextPaymentDate) {
      const nextPayment = new Date(h.nextPaymentDate);

      // ✅ If nextPaymentDate is today or already passed
      if (today >= nextPayment) {
        await updateDoc(doc(db, "hostlers", h.id), { status: "Pending" });
      }
    }
  }
};

/**
 * Delete a hostler and free bed + delete payments
 */
export const deleteHostler = async (hostlerId, roomId, bedNo) => {
  await deleteDoc(doc(db, "hostlers", hostlerId));

  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error("Room not found!");

  const roomData = roomSnap.data();
  const updatedBeds = roomData.bedNumbers.map(b =>
    b.number === bedNo ? { ...b, status: "vacant", hostler: "" } : b
  );
  const isRoomFull = updatedBeds.every(b => b.status === "occupied");
  await updateDoc(roomRef, { bedNumbers: updatedBeds, status: isRoomFull ? "full" : "available" });

  const paymentQuery = query(collection(db, "payments"), where("hostlerId", "==", hostlerId));
  const paymentSnap = await getDocs(paymentQuery);
  for (const docSnap of paymentSnap.docs) await deleteDoc(doc(db, "payments", docSnap.id));

  return true;
};

/**
 * Get hostler payment summary (auto-refreshes status)
 */
export const getHostlerPaymentSummary = async (hostlerId) => {
  // 🟢 Auto-refresh status before fetching
  await refreshHostlerStatus();

  const hostlerSnap = await getDoc(doc(db, "hostlers", hostlerId));
  if (!hostlerSnap.exists()) return null;
  const hostler = { id: hostlerSnap.id, ...hostlerSnap.data() };

  const paymentSnap = await getDocs(collection(db, "payments"));
  const payments = paymentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(p => p.hostlerId === hostlerId);

  const joining = new Date(hostler.joiningDate);
  const today = new Date();
  let totalMonths = (today.getFullYear() - joining.getFullYear()) * 12 + (today.getMonth() - joining.getMonth());
  if (today.getDate() >= joining.getDate()) totalMonths += 1;

  let pendingMonths = 0;
  let nextPaymentDate = hostler.nextPaymentDate;
  for (let i = 0; i < totalMonths; i++) {
    const dueDate = new Date(joining.getFullYear(), joining.getMonth() + i, joining.getDate());
    const dueStr = dueDate.toISOString().slice(0, 10);
    const paid = payments.some(p => p.month === dueStr && p.status === "paid");
    if (!paid) {
      pendingMonths++;
      if (!nextPaymentDate) nextPaymentDate = dueStr;
    }
  }

  return {
    hostler,
    payments,
    totalMonths,
    pendingMonths,
    nextPaymentDate,
    status: pendingMonths > 0 ? "Pending" : "Paid",
    monthlyAmount: hostler.price,
  };
};



/**
 * Update hostler details, handle room & bed changes
 * @param {string} hostlerId 
 * @param {object} updatedData - {name, phone, aadhar, joiningDate, nextPaymentDate, price, image, roomId, bedNo}
 */
export const updateHostler = async (hostlerId, updatedData) => {
  const hostlerRef = doc(db, "hostlers", hostlerId);
  const hostlerSnap = await getDoc(hostlerRef);
  if (!hostlerSnap.exists()) throw new Error("Hostler not found!");

  const hostler = hostlerSnap.data();

  // --- Format phone number to +91XXXXXXXXXX ---
  if (updatedData.phone) {
    let formattedPhone = updatedData.phone.replace(/\D/g, ""); // remove non-digit characters
    if (formattedPhone.length === 10) formattedPhone = "+91" + formattedPhone;
    else if (formattedPhone.length === 12 && formattedPhone.startsWith("91")) formattedPhone = "+" + formattedPhone;
    else if (!formattedPhone.startsWith("+91")) throw new Error("Invalid phone number!");
    updatedData.phone = formattedPhone;
  }

  // --- Handle phone & aadhar uniqueness ---
  if (updatedData.phone && updatedData.phone !== hostler.phone) {
    const phoneSnap = await getDocs(query(collection(db, "hostlers"), where("phone", "==", updatedData.phone)));
    if (!phoneSnap.empty && phoneSnap.docs.some(doc => doc.id !== hostlerId)) throw new Error("Phone already exists!");
  }

  if (updatedData.aadhar && updatedData.aadhar !== hostler.aadhar) {
    const aadharSnap = await getDocs(query(collection(db, "hostlers"), where("aadhar", "==", updatedData.aadhar)));
    if (!aadharSnap.empty && aadharSnap.docs.some(doc => doc.id !== hostlerId)) throw new Error("Aadhar already exists!");
  }

  // --- Update old room bed to vacant if room changed ---
  if ((updatedData.roomId && updatedData.roomId !== hostler.roomId) || (updatedData.bedNo && updatedData.bedNo !== hostler.bedNo)) {
    const oldRoomRef = doc(db, "rooms", hostler.roomId);
    const oldRoomSnap = await getDoc(oldRoomRef);
    if (oldRoomSnap.exists()) {
      const oldBeds = oldRoomSnap.data().bedNumbers.map((b) =>
        b.number === hostler.bedNo ? { ...b, status: "vacant", hostler: "" } : b
      );
      const isFullOld = oldBeds.every((b) => b.status === "occupied");
      await updateDoc(oldRoomRef, { bedNumbers: oldBeds, status: isFullOld ? "full" : "available" });
    }
  }

  // --- Update new room bed to occupied ---
  if (updatedData.roomId && updatedData.bedNo) {
    const newRoomRef = doc(db, "rooms", updatedData.roomId);
    const newRoomSnap = await getDoc(newRoomRef);
    if (newRoomSnap.exists()) {
      const newBeds = newRoomSnap.data().bedNumbers.map((b) =>
        b.number === updatedData.bedNo ? { ...b, status: "occupied", hostler: updatedData.name } : b
      );
      const isFullNew = newBeds.every((b) => b.status === "occupied");
      await updateDoc(newRoomRef, { bedNumbers: newBeds, status: isFullNew ? "full" : "available" });
    }
  }

  // --- Fetch roomNumber for the new roomId ---
  let roomNumberToUpdate = hostler.roomNumber; // default: keep old
  if (updatedData.roomId) {
    const roomRef = doc(db, "rooms", updatedData.roomId);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
      roomNumberToUpdate = roomSnap.data().roomNumber || roomNumberToUpdate;
    }
  }

  // --- Prepare hostler data, remove undefined fields ---
  const dataToUpdate = {
    ...updatedData,
    image: updatedData.image || hostler.image,
    roomNumber: roomNumberToUpdate, // ensure it updates
  };
  Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

  // --- Update hostler document ---
  await updateDoc(hostlerRef, dataToUpdate);

  return true;
};
