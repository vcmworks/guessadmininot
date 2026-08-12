// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAY3qwbXLjV1ZeoH7pcjFJugcSECx2tzxA",
  authDomain: "guesswhatinot.firebaseapp.com",
  projectId: "guesswhatinot",
  storageBucket: "guesswhatinot.firebasestorage.app",
  messagingSenderId: "13880493697",
  appId: "1:13880493697:web:7ea26cbec83097daf8af80",
  measurementId: "G-6FS5TWB14G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
