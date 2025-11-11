import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * Normalize phone to +91XXXXXXXXXX
 */
const normalizePhone = (phone) =>
  phone.startsWith("+91") ? "+91" + phone.replace(/\D/g, "").slice(2) : "+91" + phone.replace(/\D/g, "");

/**
 * Send OTP to the given phone number
 * Checks admin (users collection) or hostler (hostlers collection)
 */
export const sendOtp = async (phone) => {
  const phoneNormalized = normalizePhone(phone);
  let role = null;

  // ✅ Check admin in users collection
  const adminQuery = query(collection(db, "users"), where("phone", "==", phoneNormalized));
  const adminSnap = await getDocs(adminQuery);

  if (!adminSnap.empty) {
    role = adminSnap.docs[0].data().role || "admin";
  } else {
    // ✅ Check hostler in hostlers collection
    const hostlerQuery = query(collection(db, "hostlers"), where("phone", "==", phoneNormalized));
    const hostlerSnap = await getDocs(hostlerQuery);

    if (!hostlerSnap.empty) role = "hostler";
  }

  if (!role) throw new Error("Number not registered!");

  // ✅ Invisible reCAPTCHA
  const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
  });

  const confirmation = await signInWithPhoneNumber(auth, phoneNormalized, verifier);

  return { confirmation, role, phone: phoneNormalized };
};

/**
 * Verify OTP and return user info
 * Role must be passed from sendOtp
 */
export const verifyOtp = async (confirmation, otp, role, phone) => {
  const phoneNormalized = normalizePhone(phone);
  const result = await confirmation.confirm(otp);
  const user = result.user;

  if (role === "hostler") {
    // ✅ Fetch hostler data from hostlers collection
    const hostlerQuery = query(collection(db, "hostlers"), where("phone", "==", phoneNormalized));
    const snap = await getDocs(hostlerQuery);

    if (snap.empty) throw new Error("Hostler not found!");

    const hostlerData = snap.docs[0].data();

    // ✅ Save hostler data to localStorage for Payment page
    localStorage.setItem("hostlerData", JSON.stringify({
      id: snap.docs[0].id,
      uid: user.uid,
      phone: phoneNormalized,
      role,
      ...hostlerData,
    }));

    return {
      id: snap.docs[0].id,
      uid: user.uid,
      phone: phoneNormalized,
      role,
      ...hostlerData,
    };
  }

  // Admin return minimal info
  return {
    uid: user.uid,
    phone: phoneNormalized,
    role,
  };
};
