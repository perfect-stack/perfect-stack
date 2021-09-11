import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthGuard } from '@nestjs/passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalGuards(new (AuthGuard('jwt'))());
  await app.listen(3080);
}
bootstrap();
