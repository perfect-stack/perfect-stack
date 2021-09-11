import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersonModule } from './person/person.module';
import { AuthenticationModule } from './authentication/authentication.module';

@Module({
  imports: [AuthenticationModule, PersonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
