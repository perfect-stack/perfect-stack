import { Handler, Context } from 'aws-lambda';
import { Server } from 'http';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule, CONFIG_MODULE } from './app.module';
import { DatabaseSettings, loadOrm } from './orm/database.providers';
import { Sequelize } from 'sequelize';

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

const databaseSettings: DatabaseSettings = {
  databaseHost: process.env.DATABASE_HOST,
  databasePort: Number(process.env.DATABASE_PORT),
  databaseUser: process.env.DATABASE_USER,
  passwordProperty: process.env.DATABASE_PASSWORD,
  passwordKey: process.env.DATABASE_PASSWORD_KEY,
  databaseName: process.env.DATABASE_NAME,
};

// See: https://sequelize.org/docs/v6/other-topics/aws-lambda/
export const globalSequelize: Sequelize = null;

export const handler: Handler = async (event: any, context: Context) => {
  // if (!globalSequelize) {
  //   console.log('Lambda Handler: no globalSequelize', databaseSettings);
  //   globalSequelize = await loadOrm(databaseSettings);
  //   console.log('Lambda Handler: globalSequelize loaded ok');
  // } else {
  //   console.log('Lambda Handler: found globalSequelize');
  //   globalSequelize.connectionManager.initPools();
  //   console.log('Lambda Handler: initPools ok');
  //
  //   if (globalSequelize.connectionManager.hasOwnProperty('getConnection')) {
  //     delete globalSequelize.connectionManager.getConnection;
  //   }
  //   console.log('Lambda Handler: globalSequelize ready');
  // }

  try {
    cachedServer = await bootstrapServer();
    return await proxy(cachedServer, event, context, 'PROMISE').promise;
  } finally {
    // console.log('Lambda Handler: globalSequelize close()');
    // await globalSequelize.connectionManager.close();
    // console.log('Lambda Handler: globalSequelize closed ok');
  }
};
