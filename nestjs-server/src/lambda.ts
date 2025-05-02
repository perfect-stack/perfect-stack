import { Handler, Context } from 'aws-lambda';
import { Server } from 'http';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';

import { NestApplication, NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import sequelize, { Sequelize } from 'sequelize';
import { Logger } from '@nestjs/common';
import { OrmService } from './orm/orm.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const express = require('express');

// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely
// due to a compressed response (e.g. gzip) which has not been handled correctly
// by aws-serverless-express and/or API Gateway. Add the necessary MIME types to
// binaryMimeTypes below
const binaryMimeTypes: string[] = [];

let cachedServer: Server;
let nestApp: NestApplication;

async function bootstrapServer(): Promise<any> {
  let initNeeded = false;
  logger.log('bootstrapServer: started');
  if (!cachedServer) {
    logger.log('bootstrapServer: no cachedServer');
    const expressApp = express();
    nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    nestApp.enableCors({
      origin: [
        'http://localhost:4200',
        'http://localhost:3080',
        'https://dev2-kims-media.s3.ap-southeast-2.amazonaws.com'
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: '*',
      credentials: true, // Set to true if your client needs to send cookies or Authorization headers
    });
    nestApp.use(eventContext());

    // OpenAPI documentation
    const config = new DocumentBuilder()
      .setTitle('Web API documentation')
      .setDescription('The API documentation for the web services interface')
      .setVersion('1.x')
      .addTag('TAG')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(nestApp, config);
    SwaggerModule.setup('api-docs', nestApp, document);

    await nestApp.init();

    cachedServer = createServer(expressApp, undefined, binaryMimeTypes);
    initNeeded = true;
  } else {
    logger.log('bootstrapServer: cachedServer found');
  }

  logger.log('bootstrapServer: finished');
  return {
    nestApp,
    cachedServer,
    initNeeded,
  };
}

const logger = new Logger('Lambda');

// WARNING: This is example code, but the real code is up in the Application that imports this library

export const handler: Handler = async (event: any, context: Context) => {
  try {
    const { nestApp, cachedServer, initNeeded } = await bootstrapServer();

    const ormService = nestApp.get(OrmService) as OrmService;
    const sequelize = ormService.sequelize as Sequelize;

    // See: https://sequelize.org/docs/v6/other-topics/aws-lambda/
    if (!initNeeded) {
      logger.log('Lambda Handler: found sequelize');
      sequelize.connectionManager.initPools();
      logger.log('Lambda Handler: initPools ok');

      if (sequelize.connectionManager.hasOwnProperty('getConnection')) {
        delete sequelize.connectionManager.getConnection;
      }
    }

    return await proxy(cachedServer, event, context, 'PROMISE').promise;
  } finally {
    logger.log('Lambda Handler: sequelize close()');
    await (sequelize as any).connectionManager.close();
    logger.log('Lambda Handler: sequelize closed ok');
  }
};
