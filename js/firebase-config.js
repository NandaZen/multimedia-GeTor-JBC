// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBez6SnZX5xNv4qFoAScIvLruB3IYvQU-U",
  authDomain: "getorjbc-ff395.firebaseapp.com",
  projectId: "getorjbc-ff395",
  storageBucket: "getorjbc-ff395.firebasestorage.app",
  messagingSenderId: "996631179895",
  appId: "1:996631179895:web:90588c297acad959f48c72",
  measurementId: "G-58V68MJCHR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db=getFirestore(app);