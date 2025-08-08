/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Criteria = {
    name: string;
    operator: Criteria.operator;
    attributeType: Criteria.attributeType;
    value: string;
};
export namespace Criteria {
    export enum operator {
        EQUALS = 'Equals',
        STARTS_WITH = 'StartsWith',
        INSENSITIVE_STARTS_WITH = 'InsensitiveStartsWith',
        INSENSITIVE_LIKE = 'InsensitiveLike',
        INCLUDES = 'Includes',
        GREATER_THAN = 'GreaterThan',
        GREATER_THAN_OR_EQUAL_TO = 'GreaterThanOrEqualTo',
        LESS_THAN = 'LessThan',
        LESS_THAN_OR_EQUAL_TO = 'LessThanOrEqualTo',
    }
    export enum attributeType {
        TEXT = 'Text',
        HTML = 'Html',
        BOOLEAN = 'Boolean',
        DOUBLE = 'Double',
        INTEGER = 'Integer',
        IDENTIFIER = 'Identifier',
        DATE = 'Date',
        DATE_TIME = 'DateTime',
        TIME = 'Time',
        ENUMERATION = 'Enumeration',
        MANY_TO_ONE = 'ManyToOne',
        ONE_TO_MANY = 'OneToMany',
        ONE_TO_ONE = 'OneToOne',
        ONE_TO_POLY = 'OneToPoly',
        SELECT_MULTIPLE = 'SelectMultiple',
    }
}

