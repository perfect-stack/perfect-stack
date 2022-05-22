import {User} from './user';
import {Observable, of} from 'rxjs';
import {LoginResultListener} from '../authentication.service';

export class CognitoUser  implements User {

  loginResultListener: LoginResultListener;

  idToken: string;
  accessToken: string;

  login(): void {
    const url = 'https://nz-doc-kims-dev.auth.ap-southeast-2.amazoncognito.com/login?client_id=60q4cnpktar4r69mrib5rmfpb1&response_type=token&scope=openid&redirect_uri=http://localhost:4200/login-callback';
    //           https://nz-doc-kims-dev.auth.ap-southeast-2.amazoncognito.com/login?client_id=60q4cnpktar4r69mrib5rmfpb1&response_type=code&scope=aws.cognito.signin.user.admin+email+openid+profile&redirect_uri=http://localhost:4200/login-callback
    //           https://nz-doc-kims-dev.auth.ap-southeast-2.amazoncognito.com/login?client_id=60q4cnpktar4r69mrib5rmfpb1&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+profile&redirect_uri=http://localhost:4200/login-callback
    //           https://nz-doc-kims-dev.auth.ap-southeast-2.amazoncognito.com/login?client_id=60q4cnpktar4r69mrib5rmfpb1&response_type=token&scope=openid&redirect_uri=https://app.dev.kims.doc.govt.nz/login-callback
    window.open(url, "_self");
  }

  logout(): Observable<void> {
    // Ok so this is a crazy bit of JS, just needed to fulfill the interface contract and will probably go away soon
    // once Cognito tokens are stored in local storage. Need to Google it for an explanation.
    return of(void 0);
  }

  getBearerToken(): Observable<string> {
    return of(this.idToken);
  }

  getName(): Observable<string> {
    return of('Name GoesHere');
  }

  setLoginResultListener(listener: LoginResultListener): void {
    this.loginResultListener = listener;
  }
}
