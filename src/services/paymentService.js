import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export const uploadPayment = async (
  hostlerId,
  name,
  amount,
  numPayments,
  screenshot, // ✅ already base64 from frontend
  paymentDate
) => {
  try {
    // 🆕 Always create a new document with unique ID
    await addDoc(collection(db, "payments"), {
      hostlerId,
      name,
      amount,
      numPayments,
      screenshot,
      paymentDate: Timestamp.fromDate(new Date(paymentDate)),
      status: "pending",
      createdAt: Timestamp.now(),
    });

    console.log("✅ New payment record created successfully.");
    return { success: true };
  } catch (error) {
    console.error("❌ Error uploading payment:", error);
    return { success: false, error };
  }
};
