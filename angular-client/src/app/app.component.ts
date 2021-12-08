import {Component, OnInit} from '@angular/core';
import {
  getAuth,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import {Router} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  loggedIn = false;

  constructor(protected readonly router: Router) {}

  ngOnInit(): void {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      console.log(`Auth State change; ${user?.uid}`);
      this.loggedIn = user !== null;
    })
  }

  onLogin() {
    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        // Existing and future Auth states are now persisted in the current
        // session only. Closing the window would clear any existing state even
        // if a user forgets to sign out.
        // ...
        // New sign-in will be persisted with session persistence.
        return this.signInWithGoogle();
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(`Login failed: ${errorCode} - ${errorMessage}`);
      });
  }

  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if(credential) {
          //const accessToken = credential.accessToken;
          //const idToken = credential.idToken;

          // The signed-in user info.
          const user = result.user;
          //console.log(`Login successful: ${JSON.stringify(credential.toJSON())}`);
          console.log(`User = ${JSON.stringify(user.toJSON())}`);
          this.router.navigate(['/person/search']);
        }
      }).catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(`Login failed: ${errorCode} - ${errorMessage}`);
    });
  }

  onLogout() {
    console.log('onLogout()');
    const auth = getAuth();
    auth.signOut().then(() => {
      this.router.navigate(['/']);
      console.log('Sign out completed');
    });
  }
}
