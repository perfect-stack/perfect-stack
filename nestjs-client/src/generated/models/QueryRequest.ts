/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Criteria } from './Criteria';
export type QueryRequest = {
    metaEntityName: string;
    criteria: Criteria;
    customQuery: string;
    orderByName: string;
    orderByDir: string;
    pageNumber: number;
    pageSize: number;
};

