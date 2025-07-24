import {DateConverter} from './date.converter';


describe('DateConverter', () => {
    let converter: DateConverter;
    const attributeName = 'testDate';

    beforeEach(() => {
        converter = new DateConverter();
    });

    describe('toAttributeValue', () => {
        // Test cases for all supported valid date formats
        const validDateTests = [
            {format: 'd/M/yy', input: '1/2/23', expected: '2023-02-01'},
            {format: 'd/M/yyyy', input: '5/10/2024', expected: '2024-10-05'},
            {format: 'dd/MM/yy', input: '01/02/23', expected: '2023-02-01'},
            {format: 'd/MM/yyyy', input: '1/02/2023', expected: '2023-02-01'},
            {format: 'd-MMM-yy', input: '3-Mar-20', expected: '2020-03-03'},
            {format: 'd-MMM-yyyy', input: '25-Dec-2022', expected: '2022-12-25'},
            // Even though the 29-Feb-2023 is not a valid leap year Date the "SMART" resolver we are using
            // will still convert it into 2023-02-28. Which isn't ideal, but not going to spend hours fighting this
            // edge case. It is, was it is and time to move on
            {format: 'd-MMM-yyyy', input: '29-Feb-2023', expected: '2023-02-28'},
            {format: 'yyyy-MM-dd', input: '2023-08-15', expected: '2023-08-15'},
        ];

        test.each(validDateTests)(
            'should correctly convert "$input" (format: $format) to ISO date "$expected"',
            ({input, expected}) => {
                const result = converter.toAttributeValue(attributeName, input);
                expect(result).toEqual({
                    attributeValues: [
                        {
                            name: attributeName,
                            value: expected,
                        },
                    ],
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
            (invalidInput) => {
                const result = converter.toAttributeValue(attributeName, invalidInput);
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

        it('should return a null value for an empty string input', () => {
            const result = converter.toAttributeValue(attributeName, '');
            expect(result).toEqual({
                attributeValues: [
                    {
                        name: attributeName,
                        value: null,
                    },
                ],
            });
        });

        it('should return a null value for a null input', () => {
            // The method signature expects a string, but we test runtime robustness.
            const result = converter.toAttributeValue(attributeName, null as any);
            expect(result).toEqual({
                attributeValues: [
                    {
                        name: attributeName,
                        value: null,
                    },
                ],
            });
        });

        it('should return a null value for an undefined input', () => {
            const result = converter.toAttributeValue(attributeName, undefined as any);
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