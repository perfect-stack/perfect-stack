import { Controller, Post } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('/admin')
export class AdminController {
  constructor(protected readonly adminService: AdminService) {}

  @Post('createFakePeople')
  public loadFakePeople() {
    return this.adminService.createFakePeople();
  }
}
