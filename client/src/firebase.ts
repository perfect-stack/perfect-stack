import firebase from "firebase";

// If you're not using Code Sandbox, never hard-code the keys! Add them in your .env file and link them here
var firebaseConfig = {
    apiKey: "AIzaSyCtVTAP_Np5yuJqOLuG9kSNKmUqHGro96g",
    authDomain: "person-registry.firebaseapp.com",
    projectId: "person-registry",
    storageBucket: "person-registry.appspot.com",
    messagingSenderId: "465100558579",
    appId: "1:465100558579:web:388d55268768f97eeb6786"
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
