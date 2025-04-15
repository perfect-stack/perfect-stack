import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    //logger: ['error', 'warn', 'debug'],
    logger: ['error', 'warn'],
  });
  app.enableCors();

  // OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Web API documentation')
    .setDescription('The API documentation for the web services interface')
    .setVersion('1.x')
    .addTag('TAG')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3080);
}
bootstrap();
