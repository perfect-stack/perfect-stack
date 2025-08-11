import fs from "fs";
import path from "path";
import {Criteria, DataService, MediaService, OpenAPI, QueryRequest} from "./generated";


import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configure the base URL of your running NestJS server
//OpenAPI.BASE = 'http://localhost:3080';
//OpenAPI.BASE = 'https://app.dev.kims.doc.govt.nz/api';
OpenAPI.BASE = 'https://app.test.kims.doc.govt.nz/api';



interface BadFile {
    dirPath: string,
    fileName: string,
    reason: string
}


const IMAGE_FOLDERS = [
    "/Users/richardperfect/dev/perfect-consulting/Kea Images/Kerry"
]

let birdCount = 0;
let goodImageCount = 0;
let badFileCount = 0;
let goodFiles: Set<string> = new Set();
let badFiles: BadFile[] = [];


async function migrateImages() {
    console.log('Migrate Images')

    // The JWT token is now loaded securely from your .env file
    const jwtToken = process.env.JWT_TOKEN;

    // Add a check to ensure the token is available
    if (!jwtToken || jwtToken === 'your_jwt_bearer_token_here') {
        console.error('Authentication error: JWT_TOKEN is not set in your .env file.');
        console.error('Please update the .env file in the root of the nestjs-client project with your actual token.');
        return; // Stop execution if the token is missing
    }

    OpenAPI.TOKEN = jwtToken;


    // for each folder from IMAGE_FOLDERS
    for (const dirPath of IMAGE_FOLDERS) {
        await processDir(dirPath);
    }

    console.log('\nBirdCount: ' + birdCount);
    console.log('GoodImageCount: ' + goodImageCount);
    console.log('BadFileCount: ' + badFileCount);

    console.log('\nGood Files:');
    for(const goodFile of goodFiles) {
        console.log(goodFile);
    }

    console.log('\nBad Files:');
    for(const badFile of badFiles) {
        console.log('BadFile: ' + badFile.dirPath + ' ' + badFile.fileName + ' ' + badFile.reason);
    }

    return;
}

async function processDir(dirPath: string) {
    console.log(`Processing dir: ${dirPath}`);
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            birdCount++;
            const fullPath = path.join(dirPath, entry.name);
            await processDir(fullPath);
        } else {
            await processFile(dirPath, entry.name);
        }
    }
}

async function processFile(dirPath: string, fileName: string) {
    console.log('Dir: ' + dirPath + '  File: ' + fileName);
    const bandNumber = toBandNumber(dirPath, fileName);
    if(bandNumber) {
        console.log('   ' + bandNumber)
        if(fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
            const birdEntity = await findBird(dirPath, fileName, bandNumber);
            if(birdEntity) {
                await uploadFile(dirPath, fileName, birdEntity);
            }
        }
        else {
            addBadFile(dirPath, fileName, "NOT-JPG");
        }
    }
    else {
        addBadFile(dirPath, fileName, "NO-BAND");
    }
}


async function findBird(dirPath: string, fileName: string, bandNumber: string) {

    const queryResult = await DataService.dataControllerFindByCriteria({
        metaEntityName: 'Bird',
        criteria: [{
            name: 'band_number',
            operator: Criteria.operator.STARTS_WITH,
            attributeType: Criteria.attributeType.TEXT,
            value: bandNumber
        }],
        customQuery: '',
        orderByName: 'id',
        orderByDir: 'ASC',
        pageNumber: 1,
        pageSize: 50,
    });

    if(queryResult.totalCount === 1) {
        const birdSearchResult = queryResult.resultList[0];
        const birdEntity = await DataService.dataControllerFindOne('Bird', birdSearchResult['id']);
        if(birdEntity) {
            goodImageCount++;
            return birdEntity;
        }
        else {
            addBadFile(dirPath, fileName, "CANT-FIND-BIRD-ID");
        }
    }
    else {
        if (queryResult.totalCount === 0) {
            addBadFile(dirPath, fileName, "NO-BIRD");
        }
        else {
            addBadFile(dirPath, fileName, "MULTIPLE-BIRDS");
        }
    }
    return null;
}

async function uploadFile(dirPath: string, fileName: string, birdEntity: any) {

    const createFileResponse = await MediaService.mediaControllerCreateFile(fileName);

    // upload file to signed url
    const mediaFilePath = createFileResponse.resourceKey;
    const presignedUrl = createFileResponse.resourceUrl;

    const fullFilePath = path.join(dirPath, fileName);
    const fileContent = fs.readFileSync(fullFilePath);
    const contentType = toContentType(fileName);

    await fetch(presignedUrl, {
        method: 'PUT',
        body: fileContent,
        headers: {
            'Content-Type': contentType
        }
    });

    // Add media file to bird entity
    birdEntity['media_files'].push({
        id: null,
        path: mediaFilePath,
        mime_type: contentType,
        comments: null
    });

    console.log('Bird: ', JSON.stringify(birdEntity));

    // save the Bird
    const saveResponse = await DataService.dataControllerSave('Bird', birdEntity);


    goodFiles.add(birdEntity['band_number']);
}

function toBandNumber(dirPath: string, fileName: string) {
    const parentDir = dirPath.split('/').pop();
    if(parentDir && parentDir.startsWith('V-')) {
        const tokens = parentDir.split(/\s+/);
        if(tokens.length > 0 && tokens[0].startsWith('V-')) {
            return tokens[0];
        }
    }
    return null;
}

function addBadFile(dirPath: string, fileName: string, reason: string) {
    badFileCount++;
    badFiles.push({
        dirPath, fileName, reason
    });
}

function toContentType(filename: string) {
    if(filename && filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
        return "image/jpeg";
    }
    else {
        throw new Error('File suffix must be supplied');
    }
}

// Execute the main function...
migrateImages();
