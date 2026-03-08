import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCbQaE87_DabP05Q8LaGEFCPlN28CaAfx8",
    authDomain: "ummahsync-7a601.firebaseapp.com",
    projectId: "ummahsync-7a601",
    storageBucket: "ummahsync-7a601.firebasestorage.app",
    messagingSenderId: "672790717670",
    appId: "1:672790717670:web:8e71b034752810100fc727",
    measurementId: "G-GZDWCLC081"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Analytics requires browser environment, conditional initialization is safer but we'll include it.
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
