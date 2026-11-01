import { Injectable } from '@nestjs/common';

@Injectable()
export class UserNameService {
  getUsername(tokenAsUser: any) {
    if (tokenAsUser['username']) {
      return tokenAsUser['username'];
    } else if (tokenAsUser['cognito:username']) {
      return tokenAsUser['cognito:username'];
    } else if (tokenAsUser['email']) {
      return tokenAsUser['email'];
    } else if (tokenAsUser['preferred_username']) {
      return tokenAsUser['preferred_username'];
    } else {
      return 'Unknown';
    }
  }
}
