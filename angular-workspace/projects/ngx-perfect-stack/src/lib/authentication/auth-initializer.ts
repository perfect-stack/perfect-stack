import {getAuth, onAuthStateChanged} from 'firebase/auth';
import { initializeApp } from "firebase/app"


// If you're not using Code Sandbox, never hard-code the keys! Add them in your .env file and link them here
let firebaseConfig = {
  apiKey:             'AIzaSyBx9GKGHbH8SLma0CjtlEszdDRXqg0AIGk',
  authDomain:         'perfect-stack-demo.firebaseapp.com',
  projectId:          'perfect-stack-demo',
  storageBucket:      'perfect-stack-demo.appspot.com',
  messagingSenderId:  '460175115907',
  appId:              '1:460175115907:web:2bf054755793cc90f87db6',
};

// Initialize Firebase
let instance: any;

export default function getFirebase() {
  if (typeof window !== "undefined") {
    if (!instance) {
      instance = initializeApp(firebaseConfig);
    }
    return instance;
  }
  else {
    return null;
  }
}


export function initializeAuth() {
  if(!getFirebase()) {
    throw new Error('Unable to initialise Firebase');
  }

  return new Promise((resolve, reject) => {
    onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        console.log(`initializeAuth: user "${user.displayName}" is signed IN`);
        resolve(user);
      } else {
        console.log('initializeAuth: user is signed OUT');
        resolve(null);
      }
    });
  });
}

