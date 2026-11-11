import * as fs from 'fs';
import * as csv from 'fast-csv';
import {Injectable} from "@nestjs/common";
import {DataImportError, DataImportModel, DataImportRowResult, DataImportSkippedColumn} from "./data-import.model";
import {CreateEntityResponse, DataAttributeMapping, DataImportClientMapping, DataImportMapping, TemplateResult} from "./data-import.types";
import {Entity} from "../../domain/entity";
import {
    ConverterResult,
    DataImportConverter,
    DataListImportConverter,
    ExternalValue
} from "./converter/converter.types";
import {QueryService} from "../query.service";
import {DataService} from "../data.service";
import {ValidationService} from "../validation.service";
import {ValidationResult, ValidationResultMapController} from "../../domain/meta.rule";
import {MetaEntity} from "../../domain/meta.entity";
import {MetaEntityService} from "../../meta/meta-entity/meta-entity.service";
import {DataFormatService} from "./data-format.service";

export enum DuplicateCheckAction {
    NOT_A_DUPLICATE,
    DUPLICATE_IN_FILE_IGNORE,
    DUPLICATE_IN_DB_IGNORE,
    DUPLICATE_IN_FILE_ERROR,
    DUPLICATE_IN_DB_ERROR,
    UNABLE_TO_DETERMINE
}

export class DuplicateCheckResult {
    action: DuplicateCheckAction;
    cellNumber: number;

    constructor(action: DuplicateCheckAction = DuplicateCheckAction.NOT_A_DUPLICATE, cellNumber: number = 0) {
        this.action = action;
        this.cellNumber = cellNumber;
    }
}

export interface CheckForDuplicates {
    checkForDuplicates(headers: string[], entity: Entity, duplicateCheckList: string[]): Promise<DuplicateCheckResult>;
}

export interface PostImportActions {
    postImport(entity: Entity): Promise<void>;
}


@Injectable()
export class DataImportService {


    constructor(protected readonly queryService: QueryService,
                protected readonly dataService: DataService,
                public readonly dataFormatService: DataFormatService,
                protected readonly metaEntityService: MetaEntityService,
                protected readonly validationService: ValidationService) {
    }

    getDataImportClientMapping(): DataImportClientMapping[] {
        return this.dataFormatService.getDataImportClientMapping();
    }

    async validateSchema(
        formatKey: string,
        params: Record<string, any>,
    ): Promise<{ valid: boolean; errors: string[] }> {
        return this.dataFormatService.validateSchema(formatKey, params);
    }

    async generateTemplate(
        formatKey: string,
        params: Record<string, any>,
        flavour: 'grid' | 'dictionary',
    ): Promise<TemplateResult> {
        return this.dataFormatService.generateTemplate(formatKey, params, flavour);
    }

    async parseFile(dataFormat: string, filePath: string, params?: Record<string, any>): Promise<DataImportModel> {

        try {
            // Use fast-csv and parse the file into a 2d array of raw values
            // The 'async' keyword means this function will always return a Promise.
            // We wrap the stream-based parser in a new Promise so we can 'await' its completion.
            const data: string[][] = await new Promise((resolve, reject) => {
                const data: string[][] = [];

                // read the file from the filePath and create a stream for it
                const stream = fs.createReadStream(filePath);

                stream
                    .pipe(csv.parse({headers: false})) // 'headers: false' ensures the header row is treated like any other data row.
                    .on('error', (error) => reject(error))
                    .on('data', (row: string[]) => data.push(row))
                    .on('end', (rowCount: number) => {
                        console.log(`Successfully parsed ${rowCount} rows.`);
                        resolve(data);
                    });
            });

            if(!this.dataFormatService.isValidDataFormat(dataFormat)) {
                throw new Error(`Unknown data format of: ${dataFormat}`);
            }

            const dataImportModel = new DataImportModel();
            if (data && data.length > 0) {
                dataImportModel.dataFormat = dataFormat;
                dataImportModel.headers = data[0];
                dataImportModel.dataRows = data.slice(1);
                dataImportModel.duplicateCheckList = [];
                dataImportModel.importResult = [];
                dataImportModel.parameters = params;
            }

            return dataImportModel;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                status: 'error',
                dataFormat: dataFormat,
                headers: ["Error parsing file"],
                dataRows: [[errorMessage]],
                importedEntityList: [],
                duplicateCheckList: [],
                importResult: [{
                    skipReason: "Processed",
                    skipFlag: false,
                    errors: [{
                        cols: [0],
                        row: 0,
                        message: errorMessage
                    }],
                    importedEntity: null,
                    skippedColumns: [],
                    proposedEntity: null,
                    actualEntity: null
                }]
            }
        }
    }

    async dataImportValidate(stepIndex: number, dataImportModel: DataImportModel) {

        if(stepIndex === 0) {
            dataImportModel.importedEntityList = [];
            dataImportModel.duplicateCheckList = [];
            dataImportModel.importResult = [];
        }

        if(!dataImportModel.importResult) {
            dataImportModel.importResult = [];
        }

        const dataImportMapping = await this.findDataImportMapping(dataImportModel.dataFormat, {
            ...dataImportModel.parameters,
            headers: dataImportModel.headers,
        });
        if (!dataImportMapping) {
            throw new Error(`Data import format '${dataImportModel.dataFormat}' not found`);
        }
        const skippedColumns = this.findSkippedColumns(dataImportMapping, dataImportModel.headers);
        const nextRow = dataImportModel.dataRows[stepIndex];

        if (this.isBlankRow(dataImportModel.headers, nextRow, dataImportMapping)) {
            dataImportModel.importResult.push({
                skipReason: "Blank",
                skipFlag: true,
                errors: [],
                importedEntity: null,
                skippedColumns: skippedColumns,
                proposedEntity: null,
                actualEntity: null
            });
        }
        else {
            const createEntityResponse = await this.createEntity(dataImportMapping, dataImportModel.headers, nextRow, stepIndex, dataImportModel.duplicateCheckList);
            const rowErrors: DataImportError[] = [...createEntityResponse.dataImportErrors];

            if(createEntityResponse.duplicateCheckResult.action === DuplicateCheckAction.DUPLICATE_IN_FILE_IGNORE) {
                dataImportModel.importResult.push({
                    skipReason: "Duplicate",
                    skipFlag: true,
                    duplicateReason: "Duplicate in file (ignored)",
                    errors: rowErrors,
                    importedEntity: null,
                    skippedColumns: skippedColumns,
                    proposedEntity: createEntityResponse.entity,
                    actualEntity: null
                });
            }
            else {
                const validationResultMapController = await this.validate(dataImportMapping.metaEntityName, createEntityResponse.entity);
                if (validationResultMapController.hasErrors()) {
                    const validationErrors = this.addErrors(validationResultMapController, stepIndex, dataImportModel.headers, dataImportMapping, nextRow, createEntityResponse.entity);
                    rowErrors.push(...validationErrors);
                    dataImportModel.importResult.push({
                        skipReason: "Processed",
                        skipFlag: false,
                        errors: rowErrors,
                        importedEntity: null,
                        skippedColumns: skippedColumns,
                        proposedEntity: createEntityResponse.entity,
                        actualEntity: null
                    });
                }
                else {
                    if(createEntityResponse.duplicateCheckResult.action === DuplicateCheckAction.DUPLICATE_IN_DB_ERROR) {
                        dataImportModel.importResult.push({
                            skipReason: "Processed",
                            skipFlag: false,
                            duplicateReason: "Duplicate entity in database",
                            errors: rowErrors,
                            importedEntity: null,
                            skippedColumns: skippedColumns,
                            proposedEntity: createEntityResponse.entity,
                            actualEntity: null
                        });
                    }
                    else {
                        dataImportModel.importResult.push({
                            skipReason: "Processed",
                            skipFlag: false,
                            errors: rowErrors,
                            importedEntity: null,
                            skippedColumns: skippedColumns,
                            proposedEntity: createEntityResponse.entity,
                            actualEntity: null
                        });
                    }
                }
            }
        }
    }



    async dataImportImport(stepIndex: number, dataImportModel: DataImportModel, jobId?: string) {

        if(stepIndex === 0) {
            dataImportModel.importedEntityList = [];
            dataImportModel.duplicateCheckList = [];
            dataImportModel.importResult = [];
            dataImportModel.reviewStatus = 'Review';
        }

        if(!dataImportModel.importResult) {
            dataImportModel.importResult = [];
        }

        const effectiveJobId = jobId || dataImportModel.jobId;
        if (effectiveJobId) {
            dataImportModel.jobId = effectiveJobId;
            if (!dataImportModel.parameters) {
                dataImportModel.parameters = {};
            }
            dataImportModel.parameters.jobId = effectiveJobId;
        }

        const dataImportMapping = await this.findDataImportMapping(dataImportModel.dataFormat, {
            ...dataImportModel.parameters,
            headers: dataImportModel.headers,
        });
        if (!dataImportMapping) {
            throw new Error(`Data import format '${dataImportModel.dataFormat}' not found`);
        }
        const skippedColumns = this.findSkippedColumns(dataImportMapping, dataImportModel.headers);
        const nextRow = dataImportModel.dataRows[stepIndex];

        if (this.isBlankRow(dataImportModel.headers, nextRow, dataImportMapping)) {
            dataImportModel.importedEntityList.push(null);
            dataImportModel.importResult.push({
                skipReason: "Blank",
                skipFlag: true,
                errors: [],
                importedEntity: null,
                skippedColumns: skippedColumns,
                proposedEntity: null,
                actualEntity: null
            });
        }
        else {
            const createEntityResponse = await this.createEntity(dataImportMapping, dataImportModel.headers, nextRow, stepIndex, dataImportModel.duplicateCheckList);
            const rowErrors: DataImportError[] = [...createEntityResponse.dataImportErrors];

            if(createEntityResponse.duplicateCheckResult.action === DuplicateCheckAction.DUPLICATE_IN_FILE_IGNORE) {
                dataImportModel.importedEntityList.push(null);
                dataImportModel.importResult.push({
                    skipReason: "Duplicate",
                    skipFlag: true,
                    duplicateReason: "Duplicate in file (ignored)",
                    errors: rowErrors,
                    importedEntity: null,
                    skippedColumns: skippedColumns,
                    proposedEntity: createEntityResponse.entity,
                    actualEntity: null
                });
            }
            else {
                const validationResultMapController = await this.validate(dataImportMapping.metaEntityName, createEntityResponse.entity);
                if (validationResultMapController.hasErrors()) {
                    const validationErrors = this.addErrors(validationResultMapController, stepIndex, dataImportModel.headers, dataImportMapping, nextRow, createEntityResponse.entity);
                    rowErrors.push(...validationErrors);
                    dataImportModel.importedEntityList.push(null);
                    dataImportModel.importResult.push({
                        skipReason: "Processed",
                        skipFlag: false,
                        errors: rowErrors,
                        importedEntity: null,
                        skippedColumns: skippedColumns,
                        proposedEntity: createEntityResponse.entity,
                        actualEntity: null
                    });
                }
                else {
                    if (effectiveJobId && !createEntityResponse.entity.job_id) {
                        try {
                            const metaEntity = await this.metaEntityService.findOne(dataImportMapping.metaEntityName);
                            if (metaEntity && metaEntity.attributes.some(a => a.name === 'job' || a.name === 'job_id')) {
                                createEntityResponse.entity.job_id = effectiveJobId;
                            }
                        } catch (e) {
                            // Non-fatal check failure
                        }
                    }

                    const entityResponse = await this.dataService.save(dataImportMapping.metaEntityName, createEntityResponse.entity);
                    if (entityResponse) {
                        const entityResultMapController = new ValidationResultMapController(entityResponse.validationResults);
                        if (entityResultMapController.hasErrors()) {
                            throw new Error('Attempted save, but it failed with new errors');
                        }
                        else {
                            const actualEntityPayload = {
                                ...entityResponse,
                                entity: typeof (entityResponse.entity as any)?.toJSON === 'function'
                                    ? (entityResponse.entity as any).toJSON()
                                    : entityResponse.entity
                            };
                            dataImportModel.importedEntityList.push(entityResponse.entity.id);
                            dataImportModel.importResult.push({
                                skipReason: "Processed",
                                skipFlag: false,
                                errors: rowErrors,
                                importedEntity: entityResponse.entity.id,
                                skippedColumns: skippedColumns,
                                proposedEntity: createEntityResponse.entity,
                                actualEntity: actualEntityPayload
                            });

                            if (dataImportMapping.postImportActions) {
                                await dataImportMapping.postImportActions.postImport(entityResponse.entity);
                            }
                        }
                    }
                    else {
                        throw new Error('Attempted save, but no response returned');
                    }
                }
            }
        }
    }

    findSkippedColumns(dataImportMapping: DataImportMapping, headers: string[]): DataImportSkippedColumn[] {
        const mappedIndices = new Set<number>();
        for (const attributeMapping of dataImportMapping.attributeMappings) {
            const candidates = [
                ...attributeMapping.getColumnNamesAsArray(),
                ...(attributeMapping.attributeName ? [attributeMapping.attributeName] : [])
            ];
            for (const colName of candidates) {
                const idx = this.findColumnIndex(colName, headers);
                if (idx >= 0) {
                    mappedIndices.add(idx);
                }
            }
        }

        const skippedColumns: DataImportSkippedColumn[] = [];
        for (let colIdx = 0; colIdx < headers.length; colIdx++) {
            if (!mappedIndices.has(colIdx)) {
                skippedColumns.push({
                    col: colIdx,
                    reason: "Not part of data format"
                });
            }
        }
        return skippedColumns;
    }

    addErrors(validationResultMapController: ValidationResultMapController,
              stepIndex: number,
              headers: string[],
              dataImportMapping: DataImportMapping,
              dataRow: string[] | null,
              entity: Entity
        ): DataImportError[] {

        const rowValidationErrors: DataImportError[] = [];
        if(validationResultMapController.hasErrors()) {

            // Add the validation errors to the row validation errors list
            const validationErrors = validationResultMapController.validationResultMap;
            for(const nextErrorKey of Object.keys(validationErrors)) {
                const nextError = validationErrors[nextErrorKey];
                const dataImportError = this.toDataImportError(nextError, stepIndex, headers, dataImportMapping);
                rowValidationErrors.push(dataImportError);
            }

            console.log('IMPORT ERRORS: ');
            console.log(' Data:   ' + JSON.stringify(dataRow))
            console.log(' Entity: ' + JSON.stringify(entity));
            for(const nextErrorKey of Object.keys(validationResultMapController.validationResultMap)) {
                const validationError = validationResultMapController.validationResultMap[nextErrorKey];
                console.log(` - Error: ${nextErrorKey}: ${validationError.message}`);
            }
        }
        else {
            console.log('IMPORT GOOD: ');
            console.log(' Data:   ' + JSON.stringify(dataRow))
            console.log(' Entity: ' + JSON.stringify(entity));
        }

        return rowValidationErrors;
    }

    toDataImportError(validationResult: ValidationResult,
                      rowIdx: number,
                      headers: string[],
                      dataImportMapping: DataImportMapping): DataImportError {

        const attributeMapping = dataImportMapping.attributeMappings.find(mapping => {
            mapping.getColumnNamesAsArray().includes(validationResult.name)
        });

        const columnIndices: number[] = attributeMapping ?
            this.findColumnIndices(attributeMapping.getColumnNamesAsArray(), headers)
            : [0];

        return {
            row: rowIdx,
            cols: columnIndices,
            message: validationResult.message + ` [${validationResult.name}]`
        };
    }

    async validate(entityName: string, entity: any): Promise<ValidationResultMapController> {
        const metaEntityList = await this.metaEntityService.findAll();
        const metaEntityMap = new Map<string, MetaEntity>();
        for (const nextMetaEntity of metaEntityList) {
            metaEntityMap.set(nextMetaEntity.name, nextMetaEntity);
        }

        const metaEntity = metaEntityMap.get(entityName);
        if (!metaEntity) {
            throw new Error(`Unable to find MetaEntity ${entityName}`);
        }

        return await this.validationService.validate(metaEntityMap, metaEntity, entity);
    }

    isBlankRow(headers: string[], dataRow: string[], dataImportMapping: DataImportMapping) {
        // return true if the "Imported" fields in the dataRow are null, empty, or undefined
        // - we don't care about the fields that we are not importing
        for(const nextAttributeMapping of dataImportMapping.attributeMappings) {
            if(nextAttributeMapping.indicatesBlankRow) {
                const candidates = [
                    ...nextAttributeMapping.getColumnNamesAsArray(),
                    ...(nextAttributeMapping.attributeName ? [nextAttributeMapping.attributeName] : [])
                ];
                const colIdx = this.findColumnIndex(candidates, headers);
                if (colIdx >= 0) {
                    const colValue = dataRow[colIdx];
                    if (colValue !== null && colValue !== '' && typeof colValue !== 'undefined') {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    async createEntity(dataImportMapping: DataImportMapping, headers: string[], dataRow: string[], rowIdx: number, duplicateCheckList: string[]): Promise<CreateEntityResponse> {

        // create an entity for this data row
        const entity: any = {
            id: null
        };

        const dataImportErrors: DataImportError[] = [];

        // for each data mapping
        for(const nextAttributeMapping of dataImportMapping.attributeMappings) {
            let converterResult: ConverterResult;

            const isDataListConverter = nextAttributeMapping.converter &&
                typeof (nextAttributeMapping.converter as any).toAttributeValueFromExternalValueList === 'function';

            if(isDataListConverter) {
                converterResult = await this.convertDataListExternalValue(nextAttributeMapping, headers, dataRow);
            }
            else if(nextAttributeMapping.columnName || nextAttributeMapping.attributeName) {
                const candidateNames = [
                    ...nextAttributeMapping.getColumnNamesAsArray(),
                    ...(nextAttributeMapping.attributeName ? [nextAttributeMapping.attributeName] : [])
                ];
                const colIdx = this.findColumnIndex(candidateNames, headers);
                if (colIdx >= 0) {
                    converterResult = await this.convertExternalValueAtColumn(nextAttributeMapping, colIdx, headers, dataRow);
                } else if(nextAttributeMapping.defaultValue !== undefined) {
                    converterResult = this.convertDefaultValue(nextAttributeMapping);
                } else {
                    const colDesc = nextAttributeMapping.columnName ? JSON.stringify(nextAttributeMapping.columnName) : nextAttributeMapping.attributeName;
                    throw new Error(`Unable to find column name ${colDesc} in file`);
                }
            }
            else if(nextAttributeMapping.defaultValue !== undefined) {
                converterResult = this.convertDefaultValue(nextAttributeMapping);
            }
            else {
                throw new Error(`Invalid mapping. No columnName OR default value supplied for ${nextAttributeMapping.attributeName}`);
            }

            // Add the converted results to the entity
            for(const nextAttributeValue of converterResult.attributeValues) {
                entity[nextAttributeValue.name] = nextAttributeValue.value;
                if(nextAttributeValue.error) {
                    const candidateNames = [
                        ...nextAttributeMapping.getColumnNamesAsArray(),
                        ...(nextAttributeMapping.attributeName ? [nextAttributeMapping.attributeName] : [])
                    ];
                    const colIndices = this.findColumnIndices(candidateNames, headers);
                    dataImportErrors.push({
                        row: rowIdx,
                        cols: colIndices.length > 0 ? colIndices : [0],
                        message: nextAttributeValue.error
                    });
                }
            }
        }

        // Check for duplicates (but only if no errors)
        let duplicateCheckResult = new DuplicateCheckResult(DuplicateCheckAction.NOT_A_DUPLICATE, 0);
        if(dataImportErrors.length === 0) {
            if(dataImportMapping.duplicateCheck) {
                duplicateCheckResult = await dataImportMapping.duplicateCheck.checkForDuplicates(headers, entity, duplicateCheckList);
                const col = duplicateCheckResult.cellNumber !== undefined && duplicateCheckResult.cellNumber >= 0 ? duplicateCheckResult.cellNumber : 0;

                switch (duplicateCheckResult.action) {
                    case DuplicateCheckAction.NOT_A_DUPLICATE:
                    case DuplicateCheckAction.DUPLICATE_IN_FILE_IGNORE:
                    case DuplicateCheckAction.DUPLICATE_IN_DB_IGNORE:
                        // Do nothing
                        break;
                    case DuplicateCheckAction.DUPLICATE_IN_FILE_ERROR:
                        dataImportErrors.push({
                            row: rowIdx,
                            cols: [col],
                            message: 'A duplicate in this file already exists - unable to import'
                        });
                        break;
                    case DuplicateCheckAction.DUPLICATE_IN_DB_ERROR:
                        dataImportErrors.push({
                            row: rowIdx,
                            cols: [col],
                            message: 'A duplicate entity for this data already exists in the database - unable to import'
                        });
                        break;
                    case DuplicateCheckAction.UNABLE_TO_DETERMINE:
                        dataImportErrors.push({
                            row: rowIdx,
                            cols: [col],
                            message: 'Unable to perform duplicate check - due to missing or invalid data'
                        });
                        break;
                    default:
                        throw new Error('Unhandled duplicate action - needs work ');
                }
            }
            else {
                duplicateCheckResult = new DuplicateCheckResult(DuplicateCheckAction.NOT_A_DUPLICATE, 0);
            }
        }

        return {
            entity,
            duplicateCheckResult,
            duplicateCheckAction: duplicateCheckResult.action,
            dataImportErrors
        };
    }

    async convertDataListExternalValue(attributeMapping: DataAttributeMapping, headers: string[], dataRow: string[]) {

        // The DataAttributeMapping can define a list of column names in any order (column B might be listed before column A)
        // so that when the values are extracted and passed down to the converter, the converter can then rely on ordinal
        // position of the value when doing the conversion. The mapping lists the order of the columns in the order the
        // converter needs, but that does not have to be the order in which they occur in the file.
        const externalValues: ExternalValue[] = this.findExternalValues(attributeMapping.columnName as string[], headers, dataRow);
        const converter = attributeMapping.converter as DataListImportConverter;
        const converterResult = await converter.toAttributeValueFromExternalValueList(attributeMapping.attributeName as string, externalValues);

        return converterResult;
    }

    async convertExternalValueAtColumn(attributeMapping: DataAttributeMapping, colIdx: number, headers: string[], dataRow: string[]) {
        const externalValue = dataRow[colIdx];
        const converter = attributeMapping.converter as DataImportConverter;
        if (converter && typeof converter.toAttributeValue === 'function') {
            const converterResult = await converter.toAttributeValue(attributeMapping.attributeName as string, externalValue);
            if(!converterResult) {
                throw new Error(`Unable to convert external value ${externalValue} for attribute ${attributeMapping.attributeName}`);
            }
            return converterResult;
        } else {
            return {
                attributeValues: [{
                    name: attributeMapping.attributeName as string,
                    value: externalValue
                }]
            };
        }
    }

    async convertExternalValue(attributeMapping: DataAttributeMapping, headers: string[], dataRow: string[]) {
        const candidateNames = [
            ...attributeMapping.getColumnNamesAsArray(),
            ...(attributeMapping.attributeName ? [attributeMapping.attributeName] : [])
        ];
        const colIdx = this.findColumnIndex(candidateNames, headers);
        if(colIdx < 0) {
            throw new Error(`Unable to find column name ${attributeMapping.columnName || attributeMapping.attributeName} in file`);
        }
        return this.convertExternalValueAtColumn(attributeMapping, colIdx, headers, dataRow);
    }


    convertDefaultValue(attributeMapping: DataAttributeMapping): ConverterResult {
        return {
            attributeValues: [{
                name: attributeMapping.attributeName as string,
                value: attributeMapping.defaultValue ?? null
            }]
        }
    }

    findColumnIndex(candidateNames: string | string[], headers: string[]): number {
        const candidates = Array.isArray(candidateNames) ? candidateNames : [candidateNames];
        // 1. Exact match
        for (const candidate of candidates) {
            if (!candidate) continue;
            const idx = headers.indexOf(candidate);
            if (idx >= 0) return idx;
        }

        // 2. Case-insensitive trimmed match
        for (const candidate of candidates) {
            if (!candidate) continue;
            const trimmedCandidate = candidate.trim().toLowerCase();
            const idx = headers.findIndex(h => h && h.trim().toLowerCase() === trimmedCandidate);
            if (idx >= 0) return idx;
        }

        // 3. Normalized match (ignoring spaces, underscores, and hyphens)
        const normalize = (s: string) => s.toLowerCase().replace(/[\s_\-]+/g, '');
        for (const candidate of candidates) {
            if (!candidate) continue;
            const normCandidate = normalize(candidate);
            const idx = headers.findIndex(h => h && normalize(h) === normCandidate);
            if (idx >= 0) return idx;
        }

        return -1;
    }

    findColumnIndices(columnNames: string[], headers: string[]): number[] {
        const indices: number[] = [];
        for (const colName of columnNames) {
            const idx = this.findColumnIndex(colName, headers);
            if (idx >= 0 && !indices.includes(idx)) {
                indices.push(idx);
            }
        }
        return indices;
    }

    findExternalValues(columnNames: string[], headers: string[], dataRow: string[]): ExternalValue[] {
        const externalValues: ExternalValue[] = [];
        for (const colName of columnNames) {
            const idx = this.findColumnIndex(colName, headers);
            if (idx >= 0) {
                externalValues.push({
                    name: headers[idx] || colName,
                    value: dataRow[idx],
                    col: idx
                });
            }
        }
        return externalValues;
    }


    async findDataImportMapping(dataFormat: string, params?: Record<string, any>): Promise<DataImportMapping | undefined> {
        return this.dataFormatService.getDataImportMapping(dataFormat, params);
    }

    async acceptImport(jobId: string, dataImportModel: DataImportModel): Promise<{ acceptedCount: number; message: string }> {
        return this.dataFormatService.acceptImport(dataImportModel.dataFormat, jobId);
    }
}
