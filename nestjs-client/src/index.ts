import { OpenAPI } from './generated/core/OpenAPI';
import { MetaService } from './generated/services/MetaService';

// Configure the base URL of your running NestJS server
//OpenAPI.BASE = 'http://localhost:3080';
OpenAPI.BASE = 'https://app.dev.kims.doc.govt.nz/api';

/**
 * An example function that calls the getVersion endpoint.
 */
async function getVersion() {
  try {
    console.log('Calling API to get version...');

    // Call the generated service method
    const version = await MetaService.metaMenuControllerGetVersion();
    console.log('API call successful. Version:', version);

    const metaMenu = await MetaService.metaMenuControllerFindOne();
    console.log('API call successful. Meta Menu:', JSON.stringify(metaMenu));

  } catch (error) {
    // The generated client throws detailed errors
    console.error('Failed to call API:', error);
  }
}

// Execute the example function
getVersion();
