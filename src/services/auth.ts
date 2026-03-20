import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { app } from "../firebase"; // Asegurate de exportar 'app' desde tu firebase.ts

const auth = getAuth(app);

export const login = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const logout = () => signOut(auth);

export { auth };