import { OpenAPI } from './generated/core/OpenAPI';
import { MetaService } from './generated/services/MetaService';
import { DataService } from './generated/services/DataService';

import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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

/**
 * An example of an authenticated API call to get a single Bird record.
 */
async function getBird() {
    try {
        console.log('Calling authenticated API to get Bird data...');

        // The JWT token is now loaded securely from your .env file
        const jwtToken = process.env.JWT_TOKEN;

        // Add a check to ensure the token is available
        if (!jwtToken || jwtToken === 'your_jwt_bearer_token_here') {
            console.error('Authentication error: JWT_TOKEN is not set in your .env file.');
            console.error('Please update the .env file in the root of the nestjs-client project with your actual token.');
            return; // Stop execution if the token is missing
        }

        OpenAPI.TOKEN = jwtToken;

        const birdId = '237a9a7b-f694-43f3-8cad-7d05a101f174';
        const bird = await DataService.dataControllerFindOne('Bird', birdId);

        console.log('API call successful. Bird data:', bird);

    } catch (error) {
        console.error('Failed to call authenticated API:', error);
    }
}

// Execute the example functions
// getVersion();
getBird(); // Now calling the new function