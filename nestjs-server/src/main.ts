import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
    //logger: [ 'log', 'error', 'warn'],
    //logger: [ 'error', 'warn'],
  });

  app.enableCors({
    origin: [
        'http://localhost:4200',
        'http://localhost:3080',
        'https://dev2-kims-media.s3.ap-southeast-2.amazonaws.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
    credentials: true, // Set to true if your client needs to send cookies or Authorization headers
  });

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
