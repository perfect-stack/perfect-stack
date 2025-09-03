import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {KimsServerModule} from "./kims-server.module";

async function bootstrap() {
    const app = await NestFactory.create(KimsServerModule, {
        //logger: ['log', 'error', 'warn', 'debug'],
        logger: [ 'log', 'error', 'warn'],
        //logger: [ 'error', 'warn'],
    });

    app.enableCors({
        // origin: [
        //     'http://localhost:4200',
        //     'http://localhost:3080',
        //     'https://dev2-kims-media.s3.ap-southeast-2.amazonaws.com'
        // ],
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: '*',
        credentials: true, // Set to true if your client needs to send cookies or Authorization headers
    });

    // OpenAPI documentation
    // Localhost:
    //   - http://localhost:3080/api-docs
    //   - http://localhost:3080/api-json
    // Dev
    //   - https://app.dev.kims.doc.govt.nz/api/api-docs
    //   - https://app.dev.kims.doc.govt.nz/api/api-json
    const config = new DocumentBuilder()
        .setTitle('Web API documentation')
        .setDescription('The API documentation for the web services interface')
        .setVersion('1.x')
        .addTag('TAG')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
        jsonDocumentUrl: '/api-json'
    });

    await app.listen(3080);
}
bootstrap();
