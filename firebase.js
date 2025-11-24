// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyDge0TVbKH3MSY_7glEfqphee1S6Epn4Qw",
  authDomain: "storall-bbf0f.firebaseapp.com",
  projectId: "storall-bbf0f",
  storageBucket: "storall-bbf0f.firebasestorage.app",
  messagingSenderId: "908769896906",
  appId: "1:908769896906:web:b92aa9bca37967747a8733",
  measurementId: "G-99QWJMK425"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };