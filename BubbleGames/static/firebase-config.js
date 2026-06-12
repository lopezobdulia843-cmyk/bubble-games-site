import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDc2IKuwBBdxLj2oYieaLl83XluC153zm4",
  authDomain: "bubblegames.firebaseapp.com",
  projectId: "bubblegames",
  storageBucket: "bubblegames.firebasestorage.app",
  messagingSenderId: "689476233597",
  appId: "1:689476233597:web:aef6bfdbc6b52ff77f0414"
};

// Launch!
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
