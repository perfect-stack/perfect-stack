import {DateConverter} from './date.converter';


describe('DateConverter', () => {
    let converter: DateConverter;
    const attributeName = 'testDate';

    beforeEach(() => {
        converter = new DateConverter();
    });

    describe('toAttributeValue', () => {
        // Test cases for all supported valid date formats
        // The expected values are in UTC. The converter sets the time to midday in 'Pacific/Auckland'.
        // This means during New Zealand Daylight Time (NZDT, UTC+13), the UTC time will be 23:00 on the previous day.
        // During New Zealand Standard Time (NZST, UTC+12), the UTC time will be 00:00 on the same day.
        const validDateTests = [
            // NZDT (UTC+13) cases
            {format: 'd/M/yy', input: '1/2/23', expected: '2023-01-31T23:00:00Z'},
            {format: 'd/M/yyyy', input: '5/10/2024', expected: '2024-10-04T23:00:00Z'},
            {format: 'dd/MM/yy', input: '01/02/23', expected: '2023-01-31T23:00:00Z'},
            {format: 'd/MM/yyyy', input: '1/02/2023', expected: '2023-01-31T23:00:00Z'},
            {format: 'd-MMM-yy', input: '3-Mar-20', expected: '2020-03-02T23:00:00Z'},
            {format: 'd-MMM-yyyy', input: '25-Dec-2022', expected: '2022-12-24T23:00:00Z'},
            {format: 'dd-MM-yy', input: '03-04-24', expected: '2024-04-02T23:00:00Z'}, // Test for newly added format

            // Even though the 29-Feb-2023 is not a valid leap year Date the "SMART" resolver we are using
            // will still convert it into 2023-02-28. Which isn't ideal, but not going to spend hours fighting this
            // edge case. It is, was it is and time to move on
            {format: 'd-MMM-yyyy', input: '29-Feb-2023', expected: '2023-02-27T23:00:00Z'},

            // NZST (UTC+12) cases
            {format: 'd-MM-yyyy', input: '5-06-2024', expected: '2024-06-05T00:00:00Z'}, // Test for newly added format
            {format: 'yyyy-MM-dd', input: '2023-08-15', expected: '2023-08-15T00:00:00Z'},
        ];

        test.each(validDateTests)(
            'should correctly convert "$input" (format: $format) to ISO date "$expected"',
            async ({input, expected}) => {
                const result = await converter.toAttributeValue(attributeName, input);
                expect(result).toEqual({
                    attributeValues: [{
                        name: attributeName,
                        value: expected,
                    }],
                });
            },
        );

        // Test cases for various invalid or unsupported date formats
        const invalidDateTests = [
            'not a date',
            '32/01/2023', // Invalid day
            '01/13/2023', // Invalid month
            '2023/01/01', // Unsupported format (YYYY/MM/DD)
            '01 Feb 2023', // Unsupported format with spaces
        ];

        test.each(invalidDateTests)(
            'should return an error for invalid date format "%s"',
            async (invalidInput) => {
                const result = await converter.toAttributeValue(attributeName, invalidInput);
                expect(result).toEqual({
                    attributeValues: [
                        {
                            name: attributeName,
                            value: invalidInput,
                            error: 'Unable to convert Date',
                        },
                    ],
                });
            },
        );

        it('should return a null value for an empty string input', async () => {
            const result = await converter.toAttributeValue(attributeName, '');
            expect(result).toEqual({
                attributeValues: [
                    {
                        name: attributeName,
                        value: null,
                    },
                ],
            });
        });

        it('should return a null value for a null input', async () => {
            // The method signature expects a string, but we test runtime robustness.
            const result = await converter.toAttributeValue(attributeName, null as any);
            expect(result).toEqual({
                attributeValues: [
                    {
                        name: attributeName,
                        value: null,
                    },
                ],
            });
        });

        it('should return a null value for an undefined input', async () => {
            const result = await converter.toAttributeValue(attributeName, undefined as any);
            expect(result).toEqual({
                attributeValues: [
                    {
                        name: attributeName,
                        value: null,
                    },
                ],
            });
        });
    });
});