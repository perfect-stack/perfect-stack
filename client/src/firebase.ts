import firebase from "firebase";

// If you're not using Code Sandbox, never hard-code the keys! Add them in your .env file and link them here
var firebaseConfig = {
    apiKey:             process.env.REACT_APP_API_KEY,
    authDomain:         process.env.REACT_APP_AUTH_DOMAIN,
    projectId:          process.env.REACT_APP_PROJECT_ID,
    storageBucket:      process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId:  process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId:              process.env.REACT_APP_APP_ID,
};

// Initialize Firebase
let instance: any;

export default function getFirebase() {
    if (typeof window !== "undefined") {
        if (instance) return instance;
        instance = firebase.initializeApp(firebaseConfig);
        return instance;
    }

    return null;
}
