import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types/userProfile";

const usersCollection = collection(db, "users");

function getEmailLower(email: string) {
  return email.trim().toLowerCase();
}

function mapUserProfile(uid: string, data: { email?: unknown }): UserProfile {
  const email = typeof data.email === "string" ? data.email : "";

  return {
    uid,
    email,
    emailLower: getEmailLower(email),
  };
}

export async function saveUserProfile(user: User) {
  if (!user.email) {
    return;
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email,
      emailLower: getEmailLower(user.email),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getUserProfileByEmail(email: string) {
  const emailLower = getEmailLower(email);

  if (!emailLower) {
    throw new Error("E-mailadres is verplicht.");
  }

  const usersQuery = query(
    usersCollection,
    where("emailLower", "==", emailLower),
  );
  const snapshot = await getDocs(usersQuery);
  const userDocument = snapshot.docs[0];

  if (!userDocument) {
    throw new Error("Er is geen gebruiker gevonden met dit e-mailadres.");
  }

  return mapUserProfile(userDocument.id, userDocument.data());
}

export async function getUserProfileById(userId: string) {
  const userSnapshot = await getDoc(doc(db, "users", userId));

  if (!userSnapshot.exists()) {
    return null;
  }

  return mapUserProfile(userSnapshot.id, userSnapshot.data());
}
