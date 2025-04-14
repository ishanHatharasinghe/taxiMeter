// src/firebaseConfig.js
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDppOVQHX3WrnBw08dUVsvt4ar8UerJUds",
  authDomain: "taxi-meter-web-application.firebaseapp.com",
  databaseURL: "https://taxi-meter-web-application-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "taxi-meter-web-application",
  storageBucket: "taxi-meter-web-application.appspot.com", // Changed this line
  messagingSenderId: "763561933041",
  appId: "1:763561933041:web:c75a764048c251cd435150",
  measurementId: "G-PMT2EJ7W61"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();
const analytics = getAnalytics(app);

export { analytics, app, auth, database, googleProvider };
