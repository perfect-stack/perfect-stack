import { Injectable } from '@angular/core';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup
} from 'firebase/auth';
import {ActivatedRoute, Router} from '@angular/router';
import {ClientConfigService} from '../client/config/client-config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  get redirectUrl(): string | null {
    return this._redirectUrl;
  }

  set redirectUrl(value: string | null) {
    console.log(`set redirectUrl = ${value}`);
    this._redirectUrl = value;
  }

  isLoggedIn = false;

  // store the URL so we can redirect after logging in
  private _redirectUrl: string | null = null;

  constructor(protected readonly router: Router,
              protected readonly route: ActivatedRoute,
              protected readonly clientConfigService: ClientConfigService) {
    onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        console.log(`AuthenticationService: user "${user.displayName}" is signed IN`);
        this.isLoggedIn = true;
        this.navigateToFirstPage();
      } else {
        console.log('AuthenticationService: user is signed OUT');
        this.isLoggedIn = false;
      }
    });

    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        // New sign-in will be persisted with session persistence.
        //return this.signInWithGoogle();
        console.log('browserLocalPersistence has been set');
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(`Login failed: ${errorCode} - ${errorMessage}`);
      });
  }

  login() {
    this.clientConfigService.getConfig().subscribe((config) => {
      if(config && config.AUTH_DISABLE_FOR_DEV === 'true') {
        console.warn('WARNING: authentication DISABLED for local development')
        this.isLoggedIn = true;
      }
      else {
        return this.signInWithGoogle();
      }
    })
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
          //console.log(`User = ${JSON.stringify(user.toJSON())}`);

          // don't do this here, let the authState change listener (above) do it instead
          //this.navigateToFirstPage();
        }
      }).catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(`Login failed: ${errorCode} - ${errorMessage}`);
    });
  }

  navigateToFirstPage() {
    if(this._redirectUrl) {
      this.router.navigateByUrl(this._redirectUrl);
      this._redirectUrl = null;
    }
    else {
      // TODO: needs to support query parameters once the app starts using them
      const currentUrl = new URL(window.location.href);
      this.router.navigate([currentUrl.pathname]);
    }
  }


  logout() {
    console.log('logout()');
    this.isLoggedIn = false;
    const auth = getAuth();
    auth.signOut().then(() => {
      this.router.navigate(['/']);
      console.log('Sign out completed');
    });
  }
}
