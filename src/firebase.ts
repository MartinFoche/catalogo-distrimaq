import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFEAkxJILrT1nDOT-Ci7cTsd4f-E3Wzac",
  authDomain: "distrimaq-11f1d.firebaseapp.com",
  projectId: "distrimaq-11f1d",
  storageBucket: "distrimaq-11f1d.firebasestorage.app",
  messagingSenderId: "968866211472",
  appId: "1:968866211472:web:f6c6aa84e00d633c0e5a15"
};

const app = initializeApp(firebaseConfig);

// Para que funcione sin internet, se puede usar el cache local persistente de Firestore
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export { db };