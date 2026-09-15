import {IntegerConverter} from './integer.converter';


describe('IntegerConverter', () => {
    let converter: IntegerConverter;
    const attributeName = 'item_count';

    beforeEach(() => {
        converter = new IntegerConverter();
    });

    describe('Valid Inputs', () => {
        it('should correctly convert a positive integer string', async () => {
            const result = await converter.toAttributeValue(attributeName, '42');
            expect(result.attributeValues).toHaveLength(1);
            const attributeValue = result.attributeValues[0];
            expect(attributeValue.name).toBe(attributeName);
            expect(attributeValue.value).toBe(42);
            expect(attributeValue.error).toBeUndefined();
        });

        it('should correctly convert a negative integer string', async () => {
            const result = await converter.toAttributeValue(attributeName, '-100');
            expect(result.attributeValues[0].value).toBe(-100);
            expect(result.attributeValues[0].error).toBeUndefined();
        });

        it('should correctly convert the string "0"', async () => {
            const result = await converter.toAttributeValue(attributeName, '0');
            expect(result.attributeValues[0].value).toBe(0);
            expect(result.attributeValues[0].error).toBeUndefined();
        });

        it('should handle strings with leading/trailing whitespace', async () => {
            const result = await converter.toAttributeValue(attributeName, '  99  ');
            expect(result.attributeValues[0].value).toBe(99);
            expect(result.attributeValues[0].error).toBeUndefined();
        });

        it('should correctly convert comma-separated integers', async () => {
            const result1 = await converter.toAttributeValue(attributeName, '1,542,483');
            expect(result1.attributeValues[0].value).toBe(1542483);
            expect(result1.attributeValues[0].error).toBeUndefined();

            const result2 = await converter.toAttributeValue(attributeName, '5,427,097');
            expect(result2.attributeValues[0].value).toBe(5427097);
            expect(result2.attributeValues[0].error).toBeUndefined();

            const result3 = await converter.toAttributeValue(attributeName, '1,000');
            expect(result3.attributeValues[0].value).toBe(1000);
            expect(result3.attributeValues[0].error).toBeUndefined();

            const result4 = await converter.toAttributeValue(attributeName, '-1,542,483');
            expect(result4.attributeValues[0].value).toBe(-1542483);
            expect(result4.attributeValues[0].error).toBeUndefined();

            const result5 = await converter.toAttributeValue(attributeName, '  5,427,097  ');
            expect(result5.attributeValues[0].value).toBe(5427097);
            expect(result5.attributeValues[0].error).toBeUndefined();
        });
    });

    describe('Empty and Nullish Inputs', () => {
        it('should return a null value for an empty string', async () => {
            const result = await converter.toAttributeValue(attributeName, '');
            expect(result.attributeValues[0].value).toBeNull();
            expect(result.attributeValues[0].error).toBeUndefined();
        });

        it('should return a null value for a null input', async () => {
            const result = await converter.toAttributeValue(attributeName, null);
            expect(result.attributeValues[0].value).toBeNull();
            expect(result.attributeValues[0].error).toBeUndefined();
        });

        it('should return a null value for an undefined input', async () => {
            const result = await converter.toAttributeValue(attributeName, undefined);
            expect(result.attributeValues[0].value).toBeNull();
            expect(result.attributeValues[0].error).toBeUndefined();
        });
    });

    describe('Invalid and Edge Case Inputs', () => {
        it('should return an error for a non-numeric string', async () => {
            const externalValue = 'abc';
            const result = await converter.toAttributeValue(attributeName, externalValue);
            const attributeValue = result.attributeValues[0];

            expect(attributeValue.value).toBeNull();
            expect(attributeValue.error).toBe(`Value '${externalValue}' is not a valid integer.`);
        });

        it('should return an error for a string containing only whitespace', async () => {
            const externalValue = '   ';
            const result = await converter.toAttributeValue(attributeName, externalValue);
            const attributeValue = result.attributeValues[0];

            expect(attributeValue.value).toBeNull();
            expect(attributeValue.error).toBe(`Value '${externalValue}' is not a valid integer.`);
        });

        it('should reject floating point numbers and report an error', async () => {
            const externalValue = '123.45';
            const result = await converter.toAttributeValue(attributeName, externalValue);
            const attributeValue = result.attributeValues[0];

            expect(attributeValue.value).toBeNull();
            expect(attributeValue.error).toBe(`Value '${externalValue}' is not a valid integer.`);
        });

        it('should reject floating point numbers with comma formatting', async () => {
            const externalValue = '1,234.56';
            const result = await converter.toAttributeValue(attributeName, externalValue);
            const attributeValue = result.attributeValues[0];

            expect(attributeValue.value).toBeNull();
            expect(attributeValue.error).toBe(`Value '${externalValue}' is not a valid integer.`);
        });

        it('should reject mixed alphanumeric string', async () => {
            const externalValue = '50cent';
            const result = await converter.toAttributeValue(attributeName, externalValue);
            const attributeValue = result.attributeValues[0];

            expect(attributeValue.value).toBeNull();
            expect(attributeValue.error).toBe(`Value '${externalValue}' is not a valid integer.`);
        });

        it('should reject invalid comma formatting', async () => {
            const invalidValues = ['1,23', '1,2345', ',123', '123,', '1,,234'];
            for (const val of invalidValues) {
                const result = await converter.toAttributeValue(attributeName, val);
                const attributeValue = result.attributeValues[0];
                expect(attributeValue.value).toBeNull();
                expect(attributeValue.error).toBe(`Value '${val}' is not a valid integer.`);
            }
        });
    });
});
