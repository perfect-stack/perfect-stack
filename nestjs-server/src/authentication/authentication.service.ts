import { HttpService, Injectable } from '@nestjs/common';

@Injectable()
export class AuthenticationService {
  constructor(private httpService: HttpService) {}
}
