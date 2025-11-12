import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export const uploadPayment = async (
  hostlerId,
  name,
  amount,
  screenshot, // ✅ already base64 from frontend
  paymentDate
) => {
  try {
    // 🆕 Create a new payment document
    await addDoc(collection(db, "payments"), {
      hostlerId,
      name,
      amount,
      screenshot,
      paymentDate: Timestamp.fromDate(new Date(paymentDate)),
      status: "pending",
      createdAt: Timestamp.now(),
    });

    console.log("✅ Payment record created successfully.");
    return { success: true };
  } catch (error) {
    console.error("❌ Error uploading payment:", error);
    return { success: false, error };
  }
};
