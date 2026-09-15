import {NZTMCoordinateConverter} from './nztm-coordinate.converter';


describe('NZTMCoordinateConverter', () => {
    let converter: NZTMCoordinateConverter;

    beforeEach(() => {
        converter = new NZTMCoordinateConverter();
    });

    describe('Attribute Name Validation', () => {
        it('should reject attribute names other than easting or northing', async () => {
            const result = await converter.toAttributeValue('altitude', '1542483');
            expect(result.attributeValues).toHaveLength(1);
            expect(result.attributeValues[0].value).toBeNull();
            expect(result.attributeValues[0].error).toBe(
                "Attribute name 'altitude' is not supported by NZTMCoordinateConverter. Only 'easting' and 'northing' are allowed."
            );
        });

        it('should accept "easting" as a valid attribute name', async () => {
            const result = await converter.toAttributeValue('easting', '1542483');
            expect(result.attributeValues[0].value).toBe(1542483);
            expect(result.attributeValues[0].error).toBeUndefined();
        });

        it('should accept "northing" as a valid attribute name', async () => {
            const result = await converter.toAttributeValue('northing', '5427097');
            expect(result.attributeValues[0].value).toBe(5427097);
            expect(result.attributeValues[0].error).toBeUndefined();
        });
    });

    describe('Easting Range Validation', () => {
        it('should accept Easting values within the valid range', async () => {
            const minResult = await converter.toAttributeValue('easting', '800000');
            expect(minResult.attributeValues[0].value).toBe(800000);
            expect(minResult.attributeValues[0].error).toBeUndefined();

            const maxResult = await converter.toAttributeValue('easting', '2300000');
            expect(maxResult.attributeValues[0].value).toBe(2300000);
            expect(maxResult.attributeValues[0].error).toBeUndefined();

            const commaResult = await converter.toAttributeValue('easting', '1,542,483');
            expect(commaResult.attributeValues[0].value).toBe(1542483);
            expect(commaResult.attributeValues[0].error).toBeUndefined();
        });

        it('should reject Easting values below the minimum range', async () => {
            const result = await converter.toAttributeValue('easting', '799999');
            expect(result.attributeValues[0].value).toBeNull();
            expect(result.attributeValues[0].error).toBe(
                "Easting value '799999' is outside the valid NZTM range (800000 - 2300000)."
            );
        });

        it('should reject Easting values above the maximum range', async () => {
            const result = await converter.toAttributeValue('easting', '2,300,001');
            expect(result.attributeValues[0].value).toBeNull();
            expect(result.attributeValues[0].error).toBe(
                "Easting value '2,300,001' is outside the valid NZTM range (800000 - 2300000)."
            );
        });
    });

    describe('Northing Range Validation', () => {
        it('should accept Northing values within the valid range', async () => {
            const minResult = await converter.toAttributeValue('northing', '4400000');
            expect(minResult.attributeValues[0].value).toBe(4400000);
            expect(minResult.attributeValues[0].error).toBeUndefined();

            const maxResult = await converter.toAttributeValue('northing', '6500000');
            expect(maxResult.attributeValues[0].value).toBe(6500000);
            expect(maxResult.attributeValues[0].error).toBeUndefined();

            const commaResult = await converter.toAttributeValue('northing', '5,427,097');
            expect(commaResult.attributeValues[0].value).toBe(5427097);
            expect(commaResult.attributeValues[0].error).toBeUndefined();
        });

        it('should reject Northing values below the minimum range', async () => {
            const result = await converter.toAttributeValue('northing', '4399999');
            expect(result.attributeValues[0].value).toBeNull();
            expect(result.attributeValues[0].error).toBe(
                "Northing value '4399999' is outside the valid NZTM range (4400000 - 6500000)."
            );
        });

        it('should reject Northing values above the maximum range', async () => {
            const result = await converter.toAttributeValue('northing', '6,500,001');
            expect(result.attributeValues[0].value).toBeNull();
            expect(result.attributeValues[0].error).toBe(
                "Northing value '6,500,001' is outside the valid NZTM range (4400000 - 6500000)."
            );
        });
    });

    describe('Nullish, Empty and Invalid Formats', () => {
        it('should return null without error for empty strings, null, and undefined', async () => {
            const emptyResult = await converter.toAttributeValue('easting', '');
            expect(emptyResult.attributeValues[0].value).toBeNull();
            expect(emptyResult.attributeValues[0].error).toBeUndefined();

            const nullResult = await converter.toAttributeValue('northing', null);
            expect(nullResult.attributeValues[0].value).toBeNull();
            expect(nullResult.attributeValues[0].error).toBeUndefined();

            const undefinedResult = await converter.toAttributeValue('easting', undefined);
            expect(undefinedResult.attributeValues[0].value).toBeNull();
            expect(undefinedResult.attributeValues[0].error).toBeUndefined();
        });

        it('should reject non-numeric and invalid integer formats', async () => {
            const nonNumeric = await converter.toAttributeValue('easting', 'abc');
            expect(nonNumeric.attributeValues[0].value).toBeNull();
            expect(nonNumeric.attributeValues[0].error).toBe("Value 'abc' is not a valid integer.");

            const floatVal = await converter.toAttributeValue('easting', '1542483.5');
            expect(floatVal.attributeValues[0].value).toBeNull();
            expect(floatVal.attributeValues[0].error).toBe("Value '1542483.5' is not a valid integer.");
        });
    });
});
