import { Handler, Context } from 'aws-lambda';
import { Server } from 'http';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule, CONFIG_MODULE } from './app.module';
import { DatabaseSettings, loadOrm } from './orm/database.providers';

const express = require('express');

// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely
// due to a compressed response (e.g. gzip) which has not been handled correctly
// by aws-serverless-express and/or API Gateway. Add the necessary MIME types to
// binaryMimeTypes below
const binaryMimeTypes: string[] = [];

let cachedServer: Server;

async function bootstrapServer(): Promise<Server> {
  if (!cachedServer) {
    const expressApp = express();
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    nestApp.enableCors();
    nestApp.use(eventContext());
    await nestApp.init();
    cachedServer = createServer(expressApp, undefined, binaryMimeTypes);
  }
  return cachedServer;
}

// Did a bunch of work to refactor the code until it got to this point, but then put this feature on hold for now.
// Suspect that this kind of Sequelize connection pooling is needed for scalability and to prevent "Too many Connections"
// errors but won't actually do anything for the slow performance we have at the moment, so decided to work on other
// performance topics first.
// https://sequelize.org/docs/v6/other-topics/aws-lambda/

// const databaseSettings: DatabaseSettings = {
//   databaseHost: process.env.DATABASE_HOST,
//   databasePort: Number(process.env.DATABASE_PORT),
//   databaseUser: process.env.DATABASE_USER,
//   passwordProperty: process.env.DATABASE_PASSWORD,
//   passwordKey: process.env.DATABASE_PASSWORD_KEY,
//   databaseName: process.env.DATABASE_NAME,
// };
//
// export const globalSequelize = loadOrm(databaseSettings);

export const handler: Handler = async (event: any, context: Context) => {
  cachedServer = await bootstrapServer();
  return proxy(cachedServer, event, context, 'PROMISE').promise;
};
