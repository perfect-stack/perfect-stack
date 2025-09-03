import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DataModule } from '../data/data.module';

@Module({
  controllers: [AdminController],
  imports: [DataModule],
  providers: [AdminService],
})
export class AdminModule {}
