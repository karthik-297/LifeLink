
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Replace these values with your Firebase project configuration.
const firebaseConfig = {
    apiKey: "AIzaSyDM49zvcawytuTaxd_QJVSvJIPwGplXF6M",
    authDomain: "lifelink-6b880.firebaseapp.com",
    projectId: "lifelink-6b880",
    storageBucket: "lifelink-6b880.firebasestorage.app",
    messagingSenderId: "676147018221",
    appId: "1:676147018221:web:19e2aeebee60556b2c8fe4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
