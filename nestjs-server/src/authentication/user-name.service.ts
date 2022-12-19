import { Injectable } from '@nestjs/common';

@Injectable()
export class UserNameService {
  getUsername(tokenAsUser: any) {
    if (tokenAsUser['username']) {
      return tokenAsUser['username'];
    } else if (tokenAsUser['cognito:username']) {
      return tokenAsUser['cognito:username'];
    } else {
      return 'Unknown';
    }
  }
}
