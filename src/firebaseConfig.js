// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDppOVQHX3WrnBw08dUVsvt4ar8UerJUds",
  authDomain: "taxi-meter-web-application.firebaseapp.com",
  databaseURL: "https://taxi-meter-web-application-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "taxi-meter-web-application",
  storageBucket: "taxi-meter-web-application.firebasestorage.app",
  messagingSenderId: "763561933041",
  appId: "1:763561933041:web:c75a764048c251cd435150",
  measurementId: "G-PMT2EJ7W61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);