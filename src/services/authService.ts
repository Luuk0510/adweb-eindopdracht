import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveUserProfile } from "@/services/userService";

export async function registerWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  await saveUserProfile(userCredential.user);

  return userCredential;
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );

  await saveUserProfile(userCredential.user);

  return userCredential;
}

export async function logout(): Promise<void> {
  return signOut(auth);
}
