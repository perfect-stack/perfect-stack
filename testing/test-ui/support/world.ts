import { World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from 'playwright';

export class UIWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  baseUrl: string;
  contextData: Record<string, any> = {};
  retrievedEntity?: any;
  lastError?: any;
  consoleErrors: string[] = [];
  pageErrors: string[] = [];

  constructor(options: IWorldOptions) {
    super(options);
    this.baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4200';
  }
}
