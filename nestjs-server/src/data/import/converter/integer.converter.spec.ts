import {IntegerConverter} from './integer.converter';


describe('IntegerConverter', () => {
    let converter: IntegerConverter;
    const attributeName = 'item_count';

    beforeEach(() => {
        converter = new IntegerConverter();
    });

    describe('Valid Inputs', () => {
        it('should correctly convert a positive integer string', () => {
            const result = converter.toAttributeValue(attributeName, '42');
            expect(result.attributeValues).toHaveLength(1);
            const attributeValue = result.attributeValues[0];
            expect(attributeValue.name).toBe(attributeName);
            expect(attributeValue.value).toBe('42');
            expect(attributeValue.error).toBeUndefined();
        });

        it('should correctly convert a negative integer string', () => {
            const result = converter.toAttributeValue(attributeName, '-100');
            expect(result.attributeValues[0].value).toBe('-100');
            expect(result.attributeValues[0].error).toBeUndefined();
        });

        it('should correctly convert the string "0"', () => {
            const result = converter.toAttributeValue(attributeName, '0');
            expect(result.attributeValues[0].value).toBe('0');
            expect(result.attributeValues[0].error).toBeUndefined();
        });

        it('should handle strings with leading/trailing whitespace', () => {
            const result = converter.toAttributeValue(attributeName, '  99  ');
            expect(result.attributeValues[0].value).toBe('99');
            expect(result.attributeValues[0].error).toBeUndefined();
        });
    });

    describe('Empty and Nullish Inputs', () => {
        it('should return a null value for an empty string', () => {
            const result = converter.toAttributeValue(attributeName, '');
            expect(result.attributeValues[0].value).toBeNull();
            expect(result.attributeValues[0].error).toBeUndefined();
        });

        it('should return a null value for a null input', () => {
            const result = converter.toAttributeValue(attributeName, null);
            expect(result.attributeValues[0].value).toBeNull();
            expect(result.attributeValues[0].error).toBeUndefined();
        });

        it('should return a null value for an undefined input', () => {
            const result = converter.toAttributeValue(attributeName, undefined);
            expect(result.attributeValues[0].value).toBeNull();
            expect(result.attributeValues[0].error).toBeUndefined();
        });
    });

    describe('Invalid and Edge Case Inputs', () => {
        it('should return an error for a non-numeric string', () => {
            const externalValue = 'abc';
            const result = converter.toAttributeValue(attributeName, externalValue);
            const attributeValue = result.attributeValues[0];

            expect(attributeValue.value).toBeNull();
            expect(attributeValue.error).toBe(`Value '${externalValue}' is not a valid integer.`);
        });

        it('should return an error for a string containing only whitespace', () => {
            const externalValue = '   ';
            const result = converter.toAttributeValue(attributeName, externalValue);
            const attributeValue = result.attributeValues[0];

            expect(attributeValue.value).toBeNull();
            expect(attributeValue.error).toBe(`Value '${externalValue}' is not a valid integer.`);
        });

        it('should truncate floating point numbers and not report an error', () => {
            // Note: parseInt() truncates floats. This test verifies the current behavior.
            const result = converter.toAttributeValue(attributeName, '123.45');
            expect(result.attributeValues[0].value).toBe('123');
            expect(result.attributeValues[0].error).toBeUndefined();
        });

        it('should parse leading numbers from a mixed alphanumeric string', () => {
            // Note: parseInt() stops at the first non-digit. This test verifies the current behavior.
            const result = converter.toAttributeValue(attributeName, '50cent');
            expect(result.attributeValues[0].value).toBe('50');
            expect(result.attributeValues[0].error).toBeUndefined();
        });
    });
});